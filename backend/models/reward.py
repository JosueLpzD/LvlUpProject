"""
Modelo de Recompensa (Reward)

Define la estructura de datos para las recompensas blockchain.

Analogía: Es como una "boleta de pago" que registra:
- Quién recibió la recompensa
- Por qué tarea la recibió
- Cuánto recibió
- Cuándo la reclamó
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RewardClaim(BaseModel):
    """
    Datos necesarios para SOLICITAR una recompensa
    
    Esto es lo que el frontend envía al backend cuando
    el usuario quiere reclamar una recompensa
    """
    user_address: str = Field(..., description="Dirección de wallet del usuario (ej: 0xABC...)")
    task_id: str = Field(..., description="ID de la tarea completada")
    user_id: str = Field(..., description="ID del usuario en MongoDB")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_address": "0x1234567890123456789012345678901234567890",
                "task_id": "task_001",
                "user_id": "user_12345"
            }
        }


class RewardSignature(BaseModel):
    """
    Firma generada por el backend para validar una recompensa
    
    Esto es lo que el backend DEVUELVE al frontend
    después de verificar que el usuario merece la recompensa
    """
    signature: str = Field(..., description="Firma criptográfica en hexadecimal")
    user_address: str = Field(..., description="Dirección del usuario")
    reward_amount: int = Field(..., description="Cantidad de tokens a recibir")
    task_id: str = Field(..., description="ID de la tarea")
    timestamp: int = Field(..., description="Timestamp de cuando se generó la firma")
    signer_address: str = Field(..., description="Dirección del backend que firmó")
    
    class Config:
        json_schema_extra = {
            "example": {
                "signature": "0xabcdef...",
                "user_address": "0x1234567890123456789012345678901234567890",
                "reward_amount": 100,
                "task_id": "task_001",
                "timestamp": 1738767462,
                "signer_address": "0x9876543210987654321098765432109876543210"
            }
        }


class RewardHistory(BaseModel):
    """
    Historial de una recompensa reclamada
    
    Se guarda en MongoDB después de que el usuario
    reclama exitosamente la recompensa en blockchain
    """
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="ID del usuario")
    user_address: str = Field(..., description="Dirección de wallet")
    task_id: str = Field(..., description="ID de la tarea")
    reward_amount: int = Field(..., description="Cantidad reclamada")
    signature: str = Field(..., description="Firma utilizada")
    claimed_at: datetime = Field(default_factory=datetime.utcnow, description="Cuándo se reclamó")
    transaction_hash: Optional[str] = Field(None, description="Hash de la transacción on-chain")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "user_address": "0x1234567890123456789012345678901234567890",
                "task_id": "task_001",
                "reward_amount": 100,
                "signature": "0xabcdef...",
                "claimed_at": "2026-02-05T13:00:00Z",
                "transaction_hash": "0xtxhash..."
            }
        }


class UserRewardsStats(BaseModel):
    """
    Estadísticas de recompensas de un usuario
    
    Útil para mostrar al usuario cuánto ha ganado en total
    """
    user_id: str
    total_rewards_claimed: int = Field(..., description="Total de tokens reclamados")
    total_tasks_completed: int = Field(..., description="Número de tareas completadas")
    last_claim_date: Optional[datetime] = Field(None, description="Última vez que reclamó")
    pending_rewards: int = Field(default=0, description="Recompensas pendientes de reclamar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "total_rewards_claimed": 500,
                "total_tasks_completed": 5,
                "last_claim_date": "2026-02-05T13:00:00Z",
                "pending_rewards": 100
            }
        }


class TransactionConfirm(BaseModel):
    """
    Datos para confirmar que una transacción on-chain se completó.
    
    Analogía: Es como el recibo del banco que confirma que el pago
    realmente se hizo. El frontend envía esto después de que la
    transacción blockchain sea exitosa.
    
    Flujo:
    1. Frontend llama al smart contract con la firma del backend
    2. Cuando la transacción se confirma, el frontend obtiene el tx_hash
    3. Frontend envía este modelo al backend para registrar la confirmación
    """
    user_id: str = Field(..., description="ID del usuario que reclamó")
    task_id: str = Field(..., description="ID de la tarea reclamada")
    transaction_hash: str = Field(..., description="Hash de la transacción on-chain (ej: 0xabc...)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "task_id": "507f1f77bcf86cd799439011",
                "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
            }
        }
