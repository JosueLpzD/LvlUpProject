"""
Rutas Extra Life 🪙

Endpoints para el sistema de "moneda mágica" que protege al usuario
de penalizaciones cuando falla una tarea.

Nota: Estos endpoints son "ocultos" — el frontend no los muestra en la UI,
pero se invocan automáticamente cuando el usuario falla una tarea.
"""

from fastapi import APIRouter
from models.extra_life import ExtraLifeUseRequest
from services.extra_life_service import (
    use_extra_life,
    get_extra_life_history,
    get_extra_life_count
)

# Router para los endpoints de Extra Life
extra_life_router = APIRouter()


@extra_life_router.post("/extra-life/use")
async def invoke_extra_life(request: ExtraLifeUseRequest):
    """
    🪙 Invocar Extra Life
    
    El usuario "lanza la moneda" para intentar salvarse de una penalización.
    
    Reglas:
    - Primera vez: SIEMPRE se salva (free pass)
    - Siguiente veces: 50/50 coin flip
    
    Retorna:
    - result: "saved" o "penalized"
    - attempt_number: qué número de intento fue
    - coin_flip: True/False/None (None si fue primer uso)
    """
    # Ejecutar la lógica del Extra Life
    result = await use_extra_life(request.user_id)
    
    # Construir respuesta descriptiva
    if result.attempt_number == 1:
        message = "🎁 ¡Extra Life activado! Como es tu primera vez, estás a salvo."
    elif result.result == "saved":
        message = "🪙 ¡La moneda cayó en CARA! Estás salvado. 🎉"
    else:
        message = "🪙 La moneda cayó en CRUZ. La penalización se mantiene. 💀"
    
    return {
        "result": result.result,
        "attempt_number": result.attempt_number,
        "coin_flip": result.coin_flip,
        "message": message,
        "used_at": result.used_at.isoformat()
    }


@extra_life_router.get("/extra-life/history/{user_id}")
async def get_history(user_id: str):
    """
    📜 Ver historial de Extra Lives usados por un usuario.
    
    Retorna la lista completa de intentos con sus resultados.
    """
    history = await get_extra_life_history(user_id)
    
    return {
        "user_id": user_id,
        "total_uses": len(history),
        "history": history
    }


@extra_life_router.get("/extra-life/status/{user_id}")
async def get_status(user_id: str):
    """
    🔍 Ver estado actual del Extra Life para el usuario.
    
    Informa si el próximo uso será gratuito o coin flip.
    """
    count = await get_extra_life_count(user_id)
    
    return {
        "user_id": user_id,
        "times_used": count,
        "next_use": "free_pass" if count == 0 else "coin_flip",
        "message": "🎁 Tu próximo Extra Life es GRATIS" if count == 0 
                   else f"🪙 Ya usaste {count} Extra Life(s). El próximo será coin flip (50/50)"
    }
