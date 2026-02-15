from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.blockchain_signer import signer_service
import os
import time

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

# --- Mock Service (Simulación de Lógica de Negocio) ---
# En un futuro, esto leerá de MongoDB para verificar si completó los hábitos.
def calculate_payout(user_address: str, week_id: int) -> int:
    """
    Calcula cuánto devolver al usuario basándose en su rendimiento.
    Retorna cantidad en Wei.
    Simulación: Siempre devuelve el 90% (Penalización del 10%).
    """
    # TODO: Leer deposito real del contrato o BD
    DEPOSIT_MOCK = 10**18  # 1 ETH
    
    # TODO: Leer cumplimiento de hábitos de la semana
    # habits_completed = db.count_completed_habits(user, week_id)
    # habits_required = 7
    
    # Lógica de ejemplo: 90% de retorno
    return int(DEPOSIT_MOCK * 0.9)

# --- Endpoints ---

@router.post("/settlement/sign", response_model=SettlementResponse)
async def sign_settlement(req: SettlementRequest):
    """
    Genera una firma EIP-712 para que el usuario pueda reclamar sus fondos
    del contrato HabitEscrow.
    """
    try:
        # 1. Validar lógica de negocio (Off-Chain)
        amount_to_return = calculate_payout(req.user_address, req.week_id)
        
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
