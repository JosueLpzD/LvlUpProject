"""
Rutas para la configuración del usuario.
Permite persistir preferencias como el horario visible del planificador.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.database import database

# Router para configuración
config_router = APIRouter(tags=["Config"])

# Modelo para la configuración del usuario
class UserConfig(BaseModel):
    start_hour: int = 5   # Hora de inicio del planificador (default 5am)
    end_hour: int = 21    # Hora de fin del planificador (default 9pm)

# ID fijo para el usuario único (simplificación - sin auth)
USER_CONFIG_ID = "default_user_config"


@config_router.get("/config")
async def get_user_config():
    """
    Obtiene la configuración del usuario.
    Si no existe, retorna valores por defecto.
    """
    config = await database.config.find_one({"_id": USER_CONFIG_ID})
    
    if not config:
        # Retornar valores por defecto
        return {"start_hour": 5, "end_hour": 21}
    
    return {
        "start_hour": config.get("start_hour", 5),
        "end_hour": config.get("end_hour", 21)
    }


@config_router.put("/config")
async def update_user_config(config: UserConfig):
    """
    Actualiza la configuración del usuario.
    Usa upsert para crear si no existe.
    """
    # Validar que las horas tengan sentido
    if config.start_hour < 0 or config.start_hour > 23:
        raise HTTPException(status_code=400, detail="start_hour debe estar entre 0 y 23")
    
    if config.end_hour < 0 or config.end_hour > 23:
        raise HTTPException(status_code=400, detail="end_hour debe estar entre 0 y 23")
    
    if config.start_hour >= config.end_hour:
        raise HTTPException(status_code=400, detail="start_hour debe ser menor que end_hour")
    
    # Upsert: actualizar si existe, crear si no existe
    await database.config.update_one(
        {"_id": USER_CONFIG_ID},
        {"$set": {
            "start_hour": config.start_hour,
            "end_hour": config.end_hour
        }},
        upsert=True
    )
    
    return {"message": "Configuración guardada correctamente"}
