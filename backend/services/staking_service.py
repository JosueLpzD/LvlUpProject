"""
Servicio de Staking (staking_service.py)

Lógica de negocio para el modelo Stake-to-Earn.

Analogía: Este servicio es el "administrador del gimnasio" que:
- Registra inscripciones (stakes)
- Marca asistencias (hábitos completados)
- Calcula cuánto cobrar/devolver al final del periodo
- Genera firmas para que el smart contract ejecute las acciones

Flujo completo:
1. Usuario stakea tokens on-chain → frontend envía TX hash al backend
2. Backend registra la sesión en MongoDB
3. Cada vez que completa un hábito → backend reporta al smart contract
4. Al final del ciclo → backend genera firma para que el usuario reclame
"""

from config.database import staking_collection, database
from models.staking import StakeSession, StakeStatus
from services.blockchain_signer import signer_service
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId

# Duración del ciclo de staking (7 días)
# Debe coincidir con lo configurado en el smart contract
STAKE_DURATION_DAYS = 7


async def create_stake_session(
    user_id: str,
    user_address: str,
    amount: float,
    habits_required: int,
    stake_tx_hash: str
) -> Dict[str, Any]:
    """
    Registrar una nueva sesión de staking en MongoDB.
    
    Se llama DESPUÉS de que el usuario haya stakeado tokens on-chain.
    
    Analogía: Es como registrar a un nuevo miembro del gimnasio
    después de que ya pagó en la caja.
    
    Args:
        user_id: ID del usuario en MongoDB
        user_address: Dirección de wallet
        amount: Tokens stakeados
        habits_required: Hábitos comprometidos
        stake_tx_hash: Hash de la transacción on-chain
    
    Returns:
        Diccionario con los datos de la sesión creada
    """
    
    # Verificar que no tenga un stake activo
    existing = await staking_collection.find_one({
        "user_id": user_id,
        "status": StakeStatus.ACTIVE
    })
    
    if existing:
        raise ValueError("El usuario ya tiene un stake activo")
    
    # Crear la sesión con fecha de inicio y fin
    now = datetime.utcnow()
    session = StakeSession(
        user_id=user_id,
        user_address=user_address,
        amount=amount,
        habits_required=habits_required,
        habits_completed=0,
        status=StakeStatus.ACTIVE,
        started_at=now,
        ends_at=now + timedelta(days=STAKE_DURATION_DAYS),
        stake_tx_hash=stake_tx_hash
    )
    
    # Guardar en MongoDB
    session_dict = session.model_dump(exclude={"id"})
    result = await staking_collection.insert_one(session_dict)
    
    # Retornar con el ID generado
    session_dict["_id"] = str(result.inserted_id)
    return session_dict


async def report_habit(
    user_id: str,
    task_id: str
) -> Dict[str, Any]:
    """
    Reportar que un usuario completó un hábito.
    
    Se llama cuando un timeblock se marca como completado.
    
    Analogía: Es como el entrenador marcando asistencia.
    
    Args:
        user_id: ID del usuario
        task_id: ID del timeblock completado
    
    Returns:
        Diccionario con el estado actualizado
    """
    
    # Buscar stake activo del usuario
    session = await staking_collection.find_one({
        "user_id": user_id,
        "status": StakeStatus.ACTIVE
    })
    
    if not session:
        return {
            "reported": False,
            "reason": "El usuario no tiene un stake activo"
        }
    
    # Verificar que el timeblock existe y está completado
    timeblock = await database.timeblocks.find_one({"_id": ObjectId(task_id)})
    if not timeblock or not timeblock.get("completed", False):
        return {
            "reported": False,
            "reason": "La tarea no existe o no está completada"
        }
    
    # No exceder los hábitos comprometidos
    current = session.get("habits_completed", 0)
    required = session.get("habits_required", 0)
    
    if current >= required:
        return {
            "reported": False,
            "reason": f"Ya completó todos los hábitos ({required}/{required})",
            "habits_completed": current,
            "habits_required": required
        }
    
    # Incrementar contador de hábitos
    new_count = current + 1
    await staking_collection.update_one(
        {"_id": session["_id"]},
        {"$set": {"habits_completed": new_count}}
    )
    
    return {
        "reported": True,
        "habits_completed": new_count,
        "habits_required": required,
        "completion_rate": f"{(new_count / required) * 100:.1f}%"
    }


async def generate_claim_data(user_id: str) -> Dict[str, Any]:
    """
    Generar los datos para que el usuario reclame sus recompensas on-chain.
    
    Calcula base reward, penalty y bonus, y genera firma criptográfica.
    
    Analogía: Es como la liquidación final del gimnasio:
    "Pagaste X, cumpliste Y%, te devolvemos Z + bonus W"
    
    Args:
        user_id: ID del usuario
    
    Returns:
        Diccionario con firma y datos de claim
    """
    
    # Buscar stake activo
    session = await staking_collection.find_one({
        "user_id": user_id,
        "status": StakeStatus.ACTIVE
    })
    
    if not session:
        raise ValueError("No se encontró un stake activo")
    
    # Verificar que el periodo haya terminado
    ends_at = session.get("ends_at")
    if ends_at and datetime.utcnow() < ends_at:
        remaining = ends_at - datetime.utcnow()
        raise ValueError(
            f"El periodo de staking aún no termina. "
            f"Faltan {remaining.days} días y {remaining.seconds // 3600} horas"
        )
    
    # Calcular resultados
    amount = session["amount"]
    completed = session.get("habits_completed", 0)
    required = session.get("habits_required", 1)
    
    # Tasa de completación (0.0 a 1.0)
    completion_rate = completed / required if required > 0 else 0
    
    # Base reward: proporción de lo stakeado que se devuelve
    base_reward = amount * completion_rate
    
    # Penalty: lo que pierde
    penalty = amount - base_reward
    
    # El bonus se calcula on-chain desde el penalty pool,
    # aquí solo estimamos para mostrar al usuario
    estimated_bonus = 0  # Se calculará en el smart contract
    
    # Generar firma para el smart contract
    signature_data = signer_service.generate_claim_signature(
        user_address=session["user_address"],
        reward_amount=int(base_reward),
        task_id=str(session["_id"])
    )
    
    return {
        "session_id": str(session["_id"]),
        "signature": signature_data["signature"],
        "user_address": session["user_address"],
        "amount_staked": amount,
        "habits_completed": completed,
        "habits_required": required,
        "completion_rate": f"{completion_rate * 100:.1f}%",
        "base_reward": base_reward,
        "penalty": penalty,
        "estimated_bonus": estimated_bonus,
        "timestamp": signature_data["timestamp"],
        "signer_address": signature_data["signer_address"]
    }


async def confirm_claim(
    user_id: str,
    claim_tx_hash: str
) -> Dict[str, Any]:
    """
    Confirmar que el claim on-chain se ejecutó exitosamente.
    
    Actualiza la sesión en MongoDB con los resultados finales.
    
    Args:
        user_id: ID del usuario
        claim_tx_hash: Hash de la transacción de claim
    
    Returns:
        Diccionario con confirmación
    """
    
    session = await staking_collection.find_one({
        "user_id": user_id,
        "status": StakeStatus.ACTIVE
    })
    
    if not session:
        raise ValueError("No se encontró un stake activo para confirmar")
    
    # Calcular resultados finales
    amount = session["amount"]
    completed = session.get("habits_completed", 0)
    required = session.get("habits_required", 1)
    completion_rate = completed / required if required > 0 else 0
    
    base_reward = amount * completion_rate
    penalty = amount - base_reward
    
    # Actualizar sesión como completada
    await staking_collection.update_one(
        {"_id": session["_id"]},
        {"$set": {
            "status": StakeStatus.COMPLETED,
            "claimed_at": datetime.utcnow(),
            "claim_tx_hash": claim_tx_hash,
            "base_reward": base_reward,
            "penalty": penalty,
            "bonus": 0  # Se actualiza cuando se lee la TX on-chain
        }}
    )
    
    return {
        "success": True,
        "message": "Stake completado exitosamente ✅",
        "claim_tx_hash": claim_tx_hash,
        "base_reward": base_reward,
        "penalty": penalty
    }


async def get_active_stake(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtener el stake activo de un usuario (si tiene uno).
    """
    session = await staking_collection.find_one({
        "user_id": user_id,
        "status": StakeStatus.ACTIVE
    })
    
    if session:
        # Convertir ObjectId a string para serialización
        session["_id"] = str(session["_id"])
    
    return session


async def get_stake_history(user_id: str) -> list:
    """
    Obtener historial de stakes de un usuario.
    """
    cursor = staking_collection.find({"user_id": user_id}).sort("started_at", -1)
    sessions = await cursor.to_list(length=50)
    
    # Convertir ObjectIds a strings
    for s in sessions:
        s["_id"] = str(s["_id"])
    
    return sessions


async def get_stake_stats(user_id: str) -> Dict[str, Any]:
    """
    Calcular estadísticas de staking de un usuario.
    """
    # Obtener todas las sesiones completadas
    cursor = staking_collection.find({
        "user_id": user_id,
        "status": StakeStatus.COMPLETED
    })
    completed_sessions = await cursor.to_list(length=100)
    
    # Calcular estadísticas
    total_staked = sum(s.get("amount", 0) for s in completed_sessions)
    total_earned = sum(s.get("base_reward", 0) + s.get("bonus", 0) for s in completed_sessions)
    total_penalized = sum(s.get("penalty", 0) for s in completed_sessions)
    
    # Tasa de completación promedio
    rates = []
    for s in completed_sessions:
        req = s.get("habits_required", 1)
        comp = s.get("habits_completed", 0)
        rates.append((comp / req) * 100 if req > 0 else 0)
    
    avg_rate = sum(rates) / len(rates) if rates else 0
    
    # Stake activo
    active = await get_active_stake(user_id)
    
    return {
        "user_id": user_id,
        "active_stake": active,
        "total_staked": total_staked,
        "total_earned": total_earned,
        "total_penalized": total_penalized,
        "sessions_count": len(completed_sessions),
        "completion_rate": round(avg_rate, 1)
    }
