"""
Modelo Extra Life 🪙
https://youtu.be/_zTP0_9hfPQ?si=0NY-v7nGkGFLVGmY

Define la estructura de datos para el sistema "Extra Life" — un mecanismo oculto
que protege al usuario de perder progreso o recibir penalizaciones.

Analogía: Es como tener una moneda mágica en un videojuego.
- La primera vez que la usas, SIEMPRE te salva (un regalo de bienvenida).
- Después, es un lanzamiento de moneda: cara = te salvas, cruz = pierdes.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ExtraLifeUseRequest(BaseModel):
    """
    Datos que se envían cuando un usuario invoca su Extra Life.
    
    Analogía: Es como decir "¡Quiero usar mi moneda mágica!"
    Solo necesitas decir quién eres.
    """
    user_id: str = Field(..., description="ID del usuario que invoca el Extra Life")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345"
            }
        }


class ExtraLifeResult(BaseModel):
    """
    Resultado de usar un Extra Life — se guarda en MongoDB.
    
    Analogía: Es el registro del lanzamiento de la moneda.
    Guarda cuándo se usó, qué número de intento fue, y si salió cara o cruz.
    """
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., description="ID del usuario")
    
    # Número de intento (1 = primer uso, 2+ = coin flip)
    attempt_number: int = Field(..., description="Número de uso del Extra Life")
    
    # Resultado final: "saved" (salvado) o "penalized" (penalizado)
    result: str = Field(..., description="Resultado: 'saved' o 'penalized'")
    
    # Si fue coin flip, registra el resultado de la moneda
    # None = primer uso (no hubo lanzamiento), True = cara, False = cruz
    coin_flip: Optional[bool] = Field(
        None, 
        description="Resultado del coin flip (True=cara/salvado, False=cruz/penalizado). None si fue primer uso"
    )
    
    # Timestamp
    used_at: datetime = Field(
        default_factory=datetime.utcnow, 
        description="Cuándo se usó el Extra Life"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_12345",
                "attempt_number": 2,
                "result": "saved",
                "coin_flip": True,
                "used_at": "2026-02-12T13:00:00Z"
            }
        }
