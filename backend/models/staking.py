"""
Modelo de Sesión de Staking (StakeSession)

Define la estructura de datos para las sesiones de staking del modelo Stake-to-Earn.

Analogía: Es como un "contrato de apuesta personal":
- Cuánto apostaste (amount)
- A qué te comprometiste (habits_required)
- Cuánto llevas (habits_completed)
- Cuándo empezó y termina tu compromiso
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StakeStatus(str, Enum):
    """
    Estados posibles de una sesión de staking
    
    Analogía: Es como las fases de una suscripción al gimnasio:
    - ACTIVE: Estás inscrito y en periodo activo
    - COMPLETED: Terminó el periodo y ya cobraste
    - EXPIRED: Terminó pero aún no has cobrado
    - CANCELLED: Se canceló (solo admin)
    """
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class StakeRequest(BaseModel):
    """
    Datos para INICIAR un stake (lo que envía el frontend)
    
    Analogía: Es como llenar el formulario de inscripción al gimnasio
    """
    user_address: str = Field(..., description="Dirección de wallet del usuario")
    user_id: str = Field(..., description="ID del usuario en MongoDB")
    amount: float = Field(..., gt=0, description="Cantidad de tokens a stakear")
    habits_required: int = Field(..., gt=0, le=50, description="Hábitos a cumplir en el ciclo")
    transaction_hash: str = Field(..., description="Hash de la TX de stake on-chain")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_address": "0x1234567890123456789012345678901234567890",
                "user_id": "user_12345",
                "amount": 100.0,
                "habits_required": 5,
                "transaction_hash": "0xabc..."
            }
        }


class StakeSession(BaseModel):
    """
    Sesión completa de staking guardada en MongoDB
    
    Analogía: El registro interno del gimnasio con todo tu historial
    """
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="ID del usuario")
    user_address: str = Field(..., description="Dirección de wallet")
    amount: float = Field(..., description="Tokens stakeados")
    habits_required: int = Field(..., description="Hábitos comprometidos")
    habits_completed: int = Field(default=0, description="Hábitos cumplidos hasta ahora")
    status: StakeStatus = Field(default=StakeStatus.ACTIVE, description="Estado del stake")
    
    # Timestamps del ciclo
    started_at: datetime = Field(default_factory=datetime.utcnow, description="Inicio del stake")
    ends_at: Optional[datetime] = Field(None, description="Fin del periodo de stake")
    claimed_at: Optional[datetime] = Field(None, description="Cuándo reclamó recompensas")
    
    # Datos on-chain
    stake_tx_hash: str = Field(..., description="Hash de la TX de stake")
    claim_tx_hash: Optional[str] = Field(None, description="Hash de la TX de claim")
    
    # Resultados (se llenan al hacer claim)
    base_reward: Optional[float] = Field(None, description="Recompensa base recibida")
    bonus: Optional[float] = Field(None, description="Bonus del penalty pool")
    penalty: Optional[float] = Field(None, description="Tokens perdidos por no cumplir")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "user_address": "0x123...",
                "amount": 100.0,
                "habits_required": 5,
                "habits_completed": 3,
                "status": "active",
                "started_at": "2026-02-12T12:00:00Z",
                "ends_at": "2026-02-19T12:00:00Z",
                "stake_tx_hash": "0xabc..."
            }
        }


class HabitReport(BaseModel):
    """
    Datos para reportar un hábito completado
    
    El backend lo recibe cuando un timeblock se marca como completado
    """
    user_id: str = Field(..., description="ID del usuario")
    user_address: str = Field(..., description="Dirección de wallet")
    task_id: str = Field(..., description="ID del timeblock completado")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "user_address": "0x123...",
                "task_id": "507f1f77bcf86cd799439011"
            }
        }


class StakeStats(BaseModel):
    """
    Estadísticas de staking de un usuario
    """
    user_id: str
    active_stake: Optional[StakeSession] = None
    total_staked: float = Field(default=0, description="Total tokens stakeados históricamente")
    total_earned: float = Field(default=0, description="Total ganado (base + bonus)")
    total_penalized: float = Field(default=0, description="Total perdido en penalizaciones")
    sessions_count: int = Field(default=0, description="Número de sesiones completadas")
    completion_rate: float = Field(default=0, description="Tasa promedio de cumplimiento (%)")
