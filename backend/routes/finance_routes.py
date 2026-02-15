from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.blockchain_signer import signer_service
from config.database import database
import os
import time
from datetime import datetime, timedelta

router = APIRouter(prefix="/finance", tags=["Finance & Staking"])

# --- Modelos de Request/Response ---

class SettlementRequest(BaseModel):
    user_address: str
    week_id: int
    chain_id: Optional[int] = 84532  # Base Sepolia por defecto

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

async def calculate_payout(user_address: str, week_id: int) -> int:
    """
    Calcula cuánto devolver al usuario basándose en su rendimiento REAL en MongoDB.
    Regla: Si cumple >= 5 hábitos en la semana, gana. Si no, pierde 10%.
    """
    DEPOSIT_AMOUNT = 10**18  # 1 ETH (En prod leeríamos esto del contrato usando Web3)
    
    # 1. Obtener fechas de la semana solicitada
    # Si week_id es 0 o 1 (default del frontend), usaremos la semana actual para facilitar tests
    current_iso_week = datetime.now().isocalendar()[1]
    target_week = week_id if week_id > 1 else current_iso_week
    week_dates = get_week_dates(target_week, datetime.now().year)
    
    # 2. Contar hábitos completados en esa semana
    # Nota: En este prototipo monousuario, no filtramos por user_id en TimeBlocks.
    # En producción, TimeBlock necesitaría un campo 'user_address'.
    completed_count = await database.timeblocks.count_documents({
        "date": {"$in": week_dates},
        "completed": True
    })
    
    # 3. Aplicar regla de negocio
    GOAL_PER_WEEK = 5
    
    print(f"💰 Payout Debug: Semana {target_week} | Completados: {completed_count}/{GOAL_PER_WEEK}")
    
    if completed_count >= GOAL_PER_WEEK:
        # ¡Éxito! Devuelve 100% + Recompensa (simulada aquí como 0% extra por ahora)
        return int(DEPOSIT_AMOUNT * 1.0)
    else:
        # Fallo: Devuelve solo 90% (Penalización 10%)
        return int(DEPOSIT_AMOUNT * 0.9)

# --- Endpoints ---

@router.post("/settlement/sign", response_model=SettlementResponse)
async def sign_settlement(req: SettlementRequest):
    """
    Genera una firma EIP-712 para que el usuario pueda reclamar sus fondos
    del contrato HabitEscrow.
    """
    try:
        # 1. Validar lógica de negocio (Off-Chain)
        amount_to_return = await calculate_payout(req.user_address, req.week_id)
        
        # 2. Configurar parámetros de seguridad
        deadline = int(time.time()) + 3600  # Firma válida por 1 hora
        contract_address = os.getenv("HABIT_ESCROW_ADDRESS")
        
        if not contract_address:
            raise HTTPException(status_code=500, detail="Contract address not configured in backend")
            
        # 3. Generar Firma
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
        
    except Exception as e:
        print(f"Error generando firma de liquidación: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
