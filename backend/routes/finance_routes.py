from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from services.blockchain_signer import signer_service
from config.database import database
import os
import time
from datetime import datetime, timedelta

router = APIRouter(prefix="/finance", tags=["Finance & Staking"])

# --- Modelos de Request/Response ---

class CommitmentConfig(BaseModel):
    user_address: str
    week_id: int
    mode: str = "HARD"  # "HARD" or "CUSTOM"
    selected_habit_ids: List[str] = []
    tx_hash: Optional[str] = None
    deposit_amount: Optional[str] = None
    status: str = "ACTIVE" # "ACTIVE" or "SETTLED"
    settlement_tx_hash: Optional[str] = None
    amount_returned: Optional[str] = None

class SettlementConfirmRequest(BaseModel):
    user_address: str
    week_id: int
    tx_hash: str
    amount_returned: str

class SettlementRequest(BaseModel):
    user_address: str
    week_id: int
    chain_id: Optional[int] = 84532  # Base Sepolia por defecto
    deposit_amount: Optional[str] = "0"  # Recibir como string para evitar overflow

class SettlementResponse(BaseModel):
    signature: str
    amount_to_return: int
    deadline: int
    user_address: str
    week_id: int

# --- Real Business Logic (MongoDB) ---

def get_week_dates(week_id: int, year: int = 2026):
    """Retorna lista de fechas (strings) para una semana ISO dada."""
    # Lunes de la semana
    start_date = datetime.strptime(f'{year}-W{week_id}-1', "%Y-W%W-%w")
    dates = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        dates.append(day.strftime("%Y-%m-%d"))
    return dates

async def calculate_payout(user_address: str, week_id: int, deposit_amount_wei: int) -> int:
    """
    Calcula cuánto devolver al usuario basándose en su rendimiento REAL en MongoDB.
    
    MODO HARD: Cuenta TODOS los hábitos completados.
    MODO CUSTOM: Cuenta SOLO los hábitos seleccionados en la configuración.
    """
    # Usar el monto real depositado (o fallback a 0 si nada, aunque el contrato fallará si es 0)
    DEPOSIT_AMOUNT = deposit_amount_wei
    
    if DEPOSIT_AMOUNT == 0:
        return 0
    
    # 0. Get Commitment Config
    config = await database.commitment_configs.find_one({
        "user_address": user_address,
        "week_id": week_id
    })
    
    # Default to HARD mode if no config found
    mode = config["mode"] if config else "HARD"
    selected_ids = config["selected_habit_ids"] if config else []
    
    print(f"🕵️ Payout Logic: Mode={mode}, Selected={len(selected_ids)}")

    # 1. Obtener fechas de la semana solicitada
    current_iso_week = datetime.now().isocalendar()[1]
    target_week = week_id if week_id > 1 else current_iso_week
    week_dates = get_week_dates(target_week, datetime.now().year)
    
    # 2. Construir Query Base
    query = {
        "date": {"$in": week_dates}
    }
    
    # EN MODO CUSTOM: Filtrar solo los IDs seleccionados
    if mode == "CUSTOM" and selected_ids:
        query["habit_id"] = {"$in": selected_ids}
        
    total_relevant_blocks = await database.timeblocks.count_documents(query)
    
    # 3. Contar hábitos completados (dentro del conjunto relevante)
    query["completed"] = True
    completed_count = await database.timeblocks.count_documents(query)
    
    # 4. Regla de Negocio
    # Si no había nada que hacer (total=0), devolvemos todo (no penalty for chilling)
    if total_relevant_blocks == 0:
        return int(DEPOSIT_AMOUNT)

    # Calculate rate
    completion_rate = completed_count / total_relevant_blocks
    print(f"💰 Payout Debug: Mode {mode} | {completed_count}/{total_relevant_blocks} ({completion_rate:.2%})")
    
    if completion_rate >= 0.8: # Umbral del 80% para éxito
        # Retorno completo (Integer Math)
        return DEPOSIT_AMOUNT
    else:
        # Penalización proporcional: Paga lo que fallaste
        # Regla Dura (fija): -10% -> (Amount * 9) // 10
        return (DEPOSIT_AMOUNT * 9) // 10

# --- Endpoints ---

@router.post("/config")
async def save_commitment_config(config: CommitmentConfig):
    """Guarda la configuración de riesgos para una semana."""
    # Upsert (Actualizar si existe, crear si no)
    update_data = config.dict(exclude_unset=True)
    
    await database.commitment_configs.update_one(
        {"user_address": config.user_address, "week_id": config.week_id},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Configuración de compromiso guardada", "mode": config.mode}

@router.get("/config/{user_address}/{week_id}")
async def get_commitment_config(user_address: str, week_id: int):
    """Obtiene la configuración activa para una semana."""
    config = await database.commitment_configs.find_one({
        "user_address": user_address,
        "week_id": week_id
    })
    
    if not config:
        return {"active": False, "mode": "NONE", "selected_habit_ids": []}
        
    # Convert ObjectId to string if present (though pydantic usually handles response, manual dict helps here)
    config.pop("_id", None)
    return {
        "active": True, 
        **config
    }

@router.post("/settlement/sign", response_model=SettlementResponse)
async def sign_settlement(req: SettlementRequest):
    """
    Genera una firma EIP-712 para que el usuario pueda reclamar sus fondos
    del contrato HabitEscrow.
    """
    try:
        # 1. Validaciones Iniciales & Setup
        contract_address = os.getenv("HABIT_ESCROW_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="Contract address not configured in backend")

        # --- WEI PROTOCOL: VALIDATION ---
        # Rechazar explícitamente cualquier cosa que parezca un decimal
        if req.deposit_amount and any(c in req.deposit_amount for c in ['.', ',']):
             raise HTTPException(
                status_code=400, 
                detail="Invalid format. Protocol requires atomic units (Wei/Satoshi) as integer strings. No decimals allowed."
            )

        # Convertir con seguridad
        try:
            deposit_amount = int(req.deposit_amount) if req.deposit_amount else 0
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid integer amount. Send Wei as string.")

        # 2. Validar lógica de negocio (Off-Chain)
        amount_to_return = await calculate_payout(req.user_address, req.week_id, deposit_amount)
        
        # 3. Configurar parámetros de seguridad
        deadline = int(time.time()) + 3600  # Firma válida por 1 hora
            
        # 4. Generar Firma
        signature = signer_service.generate_settlement_signature(
            user_address=req.user_address,
            week_id=req.week_id,
            amount_to_return=amount_to_return,
            deadline=deadline,
            contract_address=contract_address,
            chain_id=req.chain_id
        )
        
        return {
            "signature": signature,
            "amount_to_return": amount_to_return,
            "deadline": deadline,
            "user_address": req.user_address,
            "week_id": req.week_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generando firma de liquidación: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/debug/settle", response_model=SettlementResponse)
async def debug_force_settle(req: SettlementRequest):
    """
    ENDPOINT DE DEBUG: Fuerza la liquidación inmediata.
    Ignora si la semana ha terminado. Útil para testing.
    """
    print(f"🧪 DEBUG: Forzando liquidación para {req.week_id} con deposito {req.deposit_amount}")
    return await sign_settlement(req)

@router.post("/settlement/confirm")
async def confirm_settlement(req: SettlementConfirmRequest):
    """Marca un contrato como liquidado en la base de datos tras confirmar transacción en blockchain."""
    result = await database.commitment_configs.update_one(
        {"user_address": req.user_address, "week_id": req.week_id},
        {"$set": {
            "status": "SETTLED",
            "settlement_tx_hash": req.tx_hash,
            "amount_returned": req.amount_returned
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return {"message": "Liquidación confirmada exitosamente"}
