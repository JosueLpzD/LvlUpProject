"""
Rutas de Recompensas Blockchain (rewards_routes.py)

Endpoints API para gestionar recompensas blockchain.

Analogía: Es como la "ventanilla de recompensas" donde los usuarios:
1. Solicitan reclamar sus recompensas (POST /rewards/claim)
2. Consultan su historial (GET /rewards/history/{user_id})
3. Verifican si pueden reclamar (GET /rewards/validate/{user_id})
"""

from fastapi import APIRouter, HTTPException, status
from models.reward import (
    RewardClaim,
    RewardSignature,
    RewardHistory,
    UserRewardsStats,
    TransactionConfirm
)
from services.blockchain_signer import signer_service
from config.database import rewards_collection, database
from datetime import datetime
from typing import List, Tuple
from bson import ObjectId

# Crear el router
router = APIRouter(
    prefix="/rewards",
    tags=["Blockchain Rewards"]
)


# ============================================
# 📝 CONFIGURACIÓN DE RECOMPENSAS
# ============================================

# Cantidad de tokens por tarea completada
# En el futuro esto podría venir de una base de datos
REWARD_AMOUNT_PER_TASK = 100


# ============================================
# 🔍 FUNCIONES HELPER
# ============================================

async def verify_task_completed(task_id: str) -> Tuple[bool, bool, str]:
    """
    Verifica si una tarea existe y está completada en la base de datos.
    
    Analogía: Es como consultar el registro de tareas antes de pagar.
    No pagarías a alguien por un trabajo que no ha terminado.
    
    Args:
        task_id: ID de MongoDB de la tarea (timeblock)
    
    Returns:
        Tupla de (existe, está_completada, mensaje)
        - (True, True, "...") = La tarea existe y está completada ✅
        - (True, False, "...") = La tarea existe pero NO está completada ⚠️
        - (False, False, "...") = La tarea no existe ❌
    
    Ejemplo:
        >>> existe, completada, msg = await verify_task_completed("507f1f77bcf86cd799439011")
        >>> if existe and completada:
        ...     print("¡Puede reclamar recompensa!")
    """
    
    # Verificar que el ID sea un ObjectId válido de MongoDB
    # Un ObjectId tiene 24 caracteres hexadecimales (ej: "507f1f77bcf86cd799439011")
    if not ObjectId.is_valid(task_id):
        return (False, False, f"El ID '{task_id}' no es un ID válido de MongoDB")
    
    # Buscar la tarea en la colección de timeblocks
    # Analogía: Ir al archivo y buscar el registro original
    timeblock = await database.timeblocks.find_one({"_id": ObjectId(task_id)})
    
    if not timeblock:
        # La tarea no existe en la base de datos
        return (False, False, f"La tarea con ID '{task_id}' no existe")
    
    # La tarea existe, verificar si está completada
    is_completed = timeblock.get("completed", False)
    
    if is_completed:
        return (True, True, f"Tarea '{timeblock.get('title', 'Sin título')}' completada ✅")
    else:
        return (True, False, f"La tarea '{timeblock.get('title', 'Sin título')}' aún no está completada")


# ============================================
# 🎯 ENDPOINTS
# ============================================

@router.post("/claim", response_model=RewardSignature, status_code=status.HTTP_201_CREATED)
async def claim_reward(claim_data: RewardClaim):
    """
    Genera una firma para que el usuario reclame su recompensa
    
    Flujo:
    1. Frontend envía: user_address, task_id, user_id
    2. Backend verifica que la tarea no haya sido reclamada antes
    3. Backend genera firma criptográfica
    4. Frontend recibe la firma y la presenta al smart contract
    
    Args:
        claim_data: Datos de la solicitud de recompensa
    
    Returns:
        RewardSignature: Firma y datos necesarios para el claim on-chain
    
    Raises:
        HTTPException 400: Si la recompensa ya fue reclamada
        HTTPException 500: Si hay error al generar la firma
    
    Ejemplo de uso:
        POST /rewards/claim
        {
            "user_address": "0xABC...",
            "task_id": "task_001",
            "user_id": "user_12345"
        }
        
        Respuesta:
        {
            "signature": "0x1234...",
            "user_address": "0xABC...",
            "reward_amount": 100,
            "task_id": "task_001",
            "timestamp": 1738767462,
            "signer_address": "0x9876..."
        }
    """
    
    try:
        # 1. Verificar que la tarea existe y está COMPLETADA
        # Analogía: Antes de pagar, verificamos que el trabajo esté hecho
        existe, completada, mensaje = await verify_task_completed(claim_data.task_id)
        
        if not existe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"❌ {mensaje}"
            )
        
        if not completada:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"❌ {mensaje}. Completa la tarea primero."
            )
        
        # 2. Verificar que esta tarea no haya sido reclamada antes
        existing_claim = await rewards_collection.find_one({
            "user_id": claim_data.user_id,
            "task_id": claim_data.task_id
        })
        
        if existing_claim:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"❌ La tarea '{claim_data.task_id}' ya fue reclamada anteriormente"
            )
        
        # 2. Generar firma criptográfica
        signature_data = signer_service.generate_claim_signature(
            user_address=claim_data.user_address,
            reward_amount=REWARD_AMOUNT_PER_TASK,
            task_id=claim_data.task_id
        )
        
        # 3. Guardar en base de datos (estado: pendiente de confirmación on-chain)
        reward_record = RewardHistory(
            user_id=claim_data.user_id,
            user_address=claim_data.user_address,
            task_id=claim_data.task_id,
            reward_amount=REWARD_AMOUNT_PER_TASK,
            signature=signature_data["signature"],
            claimed_at=datetime.utcnow(),
            transaction_hash=None  # Se actualizará cuando se confirme on-chain
        )
        
        await rewards_collection.insert_one(reward_record.model_dump(exclude={"id"}))
        
        # 4. Retornar la firma al frontend
        return RewardSignature(**signature_data)
    
    except HTTPException:
        # Re-lanzar errores HTTP
        raise
    except Exception as e:
        # Manejar errores inesperados
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al generar firma: {str(e)}"
        )


@router.get("/history/{user_id}", response_model=List[RewardHistory])
async def get_reward_history(user_id: str):
    """
    Obtiene el historial de recompensas de un usuario
    
    Args:
        user_id: ID del usuario en MongoDB
    
    Returns:
        List[RewardHistory]: Lista de todas las recompensas del usuario
    
    Ejemplo de uso:
        GET /rewards/history/user_12345
        
        Respuesta:
        [
            {
                "user_id": "user_12345",
                "user_address": "0xABC...",
                "task_id": "task_001",
                "reward_amount": 100,
                "signature": "0x1234...",
                "claimed_at": "2026-02-05T13:00:00Z",
                "transaction_hash": "0xtxhash..."
            },
            ...
        ]
    """
    
    try:
        # Buscar todas las recompensas del usuario
        cursor = rewards_collection.find({"user_id": user_id})
        rewards = await cursor.to_list(length=100)
        
        # Convertir a modelos Pydantic
        return [RewardHistory(**reward) for reward in rewards]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al obtener historial: {str(e)}"
        )


@router.get("/validate/{user_id}/{task_id}", response_model=dict)
async def validate_reward_eligibility(user_id: str, task_id: str):
    """
    Verifica si un usuario puede reclamar una recompensa
    
    Útil para que el frontend muestre/oculte el botón de "Reclamar"
    
    Args:
        user_id: ID del usuario
        task_id: ID de la tarea
    
    Returns:
        dict: {"can_claim": bool, "reason": str}
    
    Ejemplo de uso:
        GET /rewards/validate/user_12345/task_001
        
        Respuesta (puede reclamar):
        {
            "can_claim": true,
            "reason": "Tarea completada y aún no reclamada"
        }
        
        Respuesta (ya reclamada):
        {
            "can_claim": false,
            "reason": "Esta tarea ya fue reclamada anteriormente"
        }
    """
    
    try:
        # 1. Verificar si la tarea existe y está completada
        existe, completada, mensaje = await verify_task_completed(task_id)
        
        if not existe:
            return {
                "can_claim": False,
                "reason": mensaje,
                "task_status": "not_found"
            }
        
        if not completada:
            return {
                "can_claim": False,
                "reason": mensaje,
                "task_status": "incomplete"
            }
        
        # 2. Verificar si ya existe un claim para esta tarea
        existing_claim = await rewards_collection.find_one({
            "user_id": user_id,
            "task_id": task_id
        })
        
        if existing_claim:
            return {
                "can_claim": False,
                "reason": "Esta tarea ya fue reclamada anteriormente",
                "task_status": "already_claimed",
                "claimed_at": existing_claim.get("claimed_at")
            }
        
        # ✅ Todas las validaciones pasaron
        return {
            "can_claim": True,
            "reason": mensaje,
            "task_status": "ready_to_claim"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al validar elegibilidad: {str(e)}"
        )


@router.get("/stats/{user_id}", response_model=UserRewardsStats)
async def get_user_stats(user_id: str):
    """
    Obtiene estadísticas de recompensas de un usuario
    
    Args:
        user_id: ID del usuario
    
    Returns:
        UserRewardsStats: Estadísticas consolidadas
    
    Ejemplo de uso:
        GET /rewards/stats/user_12345
        
        Respuesta:
        {
            "user_id": "user_12345",
            "total_rewards_claimed": 500,
            "total_tasks_completed": 5,
            "last_claim_date": "2026-02-05T13:00:00Z",
            "pending_rewards": 100
        }
    """
    
    try:
        # 1. Buscar todas las recompensas YA RECLAMADAS del usuario
        cursor = rewards_collection.find({"user_id": user_id})
        rewards = await cursor.to_list(length=1000)
        
        # Calcular estadísticas de claims existentes
        total_rewards = sum(r.get("reward_amount", 0) for r in rewards)
        total_claimed = len(rewards)  # Cantidad de tareas reclamadas
        
        # Obtener los task_ids ya reclamados (para no contarlos como pendientes)
        claimed_task_ids = {r.get("task_id") for r in rewards}
        
        # Encontrar última fecha de claim
        last_claim = None
        if rewards:
            last_claim = max(r.get("claimed_at") for r in rewards if r.get("claimed_at"))
        
        # 2. Contar timeblocks COMPLETADOS pero NO RECLAMADOS
        # Analogía: Ver cuántas tareas terminadas aún no han cobrado su recompensa
        completed_timeblocks = await database.timeblocks.find({
            "completed": True  # Solo los que están completados
        }).to_list(length=1000)
        
        # Filtrar: solo los que NO están en claimed_task_ids
        # (comparamos el _id del timeblock con los task_id reclamados)
        pending_count = 0
        for tb in completed_timeblocks:
            tb_id = str(tb.get("_id"))
            if tb_id not in claimed_task_ids:
                pending_count += 1
        
        # Calcular recompensas pendientes en tokens
        pending_rewards_amount = pending_count * REWARD_AMOUNT_PER_TASK
        
        return UserRewardsStats(
            user_id=user_id,
            total_rewards_claimed=total_rewards,
            total_tasks_completed=total_claimed + pending_count,  # Reclamadas + pendientes
            last_claim_date=last_claim,
            pending_rewards=pending_rewards_amount
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al obtener estadísticas: {str(e)}"
        )


@router.patch("/confirm", response_model=dict)
async def confirm_transaction(tx_data: TransactionConfirm):
    """
    Confirma que una transacción on-chain se completó exitosamente.
    
    El frontend llama a este endpoint DESPUÉS de que la transacción
    blockchain se confirme, para registrar el hash en nuestra base de datos.
    
    Analogía: Es como guardar el número de recibo del banco después
    de hacer un depósito exitoso.
    
    Args:
        tx_data: Datos de confirmación (user_id, task_id, transaction_hash)
    
    Returns:
        dict: Confirmación del registro
    
    Ejemplo de uso:
        PATCH /rewards/confirm
        {
            "user_id": "user_12345",
            "task_id": "507f1f77bcf86cd799439011",
            "transaction_hash": "0xabc123..."
        }
        
        Respuesta:
        {
            "success": true,
            "message": "Transacción registrada correctamente",
            "transaction_hash": "0xabc123..."
        }
    """
    
    try:
        # Buscar el registro de recompensa existente
        # Buscamos por user_id Y task_id para asegurar que es el claim correcto
        reward_record = await rewards_collection.find_one({
            "user_id": tx_data.user_id,
            "task_id": tx_data.task_id
        })
        
        if not reward_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"❌ No se encontró un claim para task_id '{tx_data.task_id}'"
            )
        
        # Verificar si ya tiene un transaction_hash (evitar sobrescribir)
        existing_hash = reward_record.get("transaction_hash")
        if existing_hash:
            return {
                "success": True,
                "message": "La transacción ya estaba registrada",
                "transaction_hash": existing_hash,
                "already_confirmed": True
            }
        
        # Actualizar el registro con el hash de la transacción
        result = await rewards_collection.update_one(
            {"_id": reward_record["_id"]},
            {
                "$set": {
                    "transaction_hash": tx_data.transaction_hash,
                    "confirmed_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="❌ No se pudo actualizar el registro"
            )
        
        return {
            "success": True,
            "message": "Transacción registrada correctamente ✅",
            "transaction_hash": tx_data.transaction_hash,
            "already_confirmed": False
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Error al confirmar transacción: {str(e)}"
        )


# Exportar el router
rewards_router = router
