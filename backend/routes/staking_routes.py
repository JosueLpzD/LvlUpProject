"""
Rutas de Staking (staking_routes.py)

Endpoints API para el modelo Stake-to-Earn.

Analogía: Es la "recepción del gimnasio" donde los usuarios pueden:
1. Inscribirse (stakear tokens) → POST /staking/stake
2. Ver su progreso → GET /staking/active/{user_id}
3. Reportar asistencia (hábito completado) → POST /staking/report-habit
4. Cobrar resultados → POST /staking/claim
5. Confirmar cobro → PATCH /staking/confirm-claim
6. Ver historial → GET /staking/history/{user_id}
7. Ver estadísticas → GET /staking/stats/{user_id}
"""

from fastapi import APIRouter, HTTPException, status
from models.staking import StakeRequest, HabitReport
from services import staking_service
from typing import List

# Crear el router con prefijo /staking
router = APIRouter(
    prefix="/staking",
    tags=["Stake-to-Earn"]
)


# ============================================
# 🎯 ENDPOINTS
# ============================================

@router.post("/stake", status_code=status.HTTP_201_CREATED)
async def create_stake(stake_data: StakeRequest):
    """
    Registrar un nuevo stake después de que el usuario stakeó tokens on-chain.
    
    Flujo:
    1. El frontend llama al smart contract HabitStaking.stake()
    2. Cuando la TX se confirma, el frontend envía los datos aquí
    3. El backend registra la sesión en MongoDB
    
    Analogía: El usuario ya pagó en la caja (on-chain),
    ahora viene a recepción a registrarse oficialmente.
    """
    try:
        session = await staking_service.create_stake_session(
            user_id=stake_data.user_id,
            user_address=stake_data.user_address,
            amount=stake_data.amount,
            habits_required=stake_data.habits_required,
            stake_tx_hash=stake_data.transaction_hash
        )
        
        return {
            "success": True,
            "message": f"Stake registrado ✅. Tienes {stake_data.habits_required} hábitos por cumplir en 7 días",
            "session": session
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al registrar stake: {str(e)}"
        )


@router.get("/active/{user_id}")
async def get_active_stake(user_id: str):
    """
    Ver el stake activo de un usuario.
    
    Útil para que el frontend muestre el progreso actual.
    
    Analogía: Ver tu ficha de asistencia actual en el gimnasio.
    """
    try:
        session = await staking_service.get_active_stake(user_id)
        
        if not session:
            return {
                "has_active_stake": False,
                "message": "No tienes un stake activo"
            }
        
        return {
            "has_active_stake": True,
            "session": session
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error: {str(e)}"
        )


@router.post("/report-habit")
async def report_habit(report: HabitReport):
    """
    Reportar que un usuario completó un hábito (timeblock completado).
    
    Se llama automáticamente cuando un timeblock se marca como completado.
    
    Analogía: El entrenador marca tu asistencia en la lista.
    """
    try:
        result = await staking_service.report_habit(
            user_id=report.user_id,
            task_id=report.task_id
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al reportar hábito: {str(e)}"
        )


@router.post("/claim/{user_id}")
async def generate_claim(user_id: str):
    """
    Generar datos y firma para reclamar recompensas on-chain.
    
    Se llama cuando el periodo de staking terminó y el usuario
    quiere recuperar sus tokens + bonus.
    
    Flujo:
    1. Backend calcula base_reward, penalty, y bonus estimado
    2. Genera firma criptográfica
    3. Frontend usa la firma para llamar HabitStaking.claimRewards()
    
    Analogía: Pedir la liquidación al final del mes en el gimnasio.
    """
    try:
        claim_data = await staking_service.generate_claim_data(user_id)
        return claim_data
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al generar claim: {str(e)}"
        )


@router.patch("/confirm-claim")
async def confirm_claim(user_id: str, claim_tx_hash: str):
    """
    Confirmar que el claim on-chain se completó.
    
    El frontend llama aquí DESPUÉS de que la TX de claim se confirme.
    
    Analogía: Entregar el recibo de pago en la recepción del gimnasio.
    """
    try:
        result = await staking_service.confirm_claim(user_id, claim_tx_hash)
        return result
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al confirmar claim: {str(e)}"
        )


@router.get("/history/{user_id}")
async def get_stake_history(user_id: str):
    """
    Obtener historial de todas las sesiones de staking de un usuario.
    
    Analogía: Ver tu historial completo de suscripciones al gimnasio.
    """
    try:
        history = await staking_service.get_stake_history(user_id)
        return {
            "user_id": user_id,
            "sessions": history,
            "total": len(history)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error: {str(e)}"
        )


@router.get("/stats/{user_id}")
async def get_stake_stats(user_id: str):
    """
    Obtener estadísticas consolidadas de staking.
    
    Analogía: Tu reporte de rendimiento anual en el gimnasio.
    """
    try:
        stats = await staking_service.get_stake_stats(user_id)
        return stats
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error: {str(e)}"
        )


# Exportar el router
staking_router = router
