from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# BaseModel es la "plantilla maestra" de FastAPI para validar datos.
class TimeBlock(BaseModel):
    # Definimos los "ingredientes" obligatorios de nuestro plato.
    title: str
    habit_id: str # Para mantener el color/icono en el frontend
    
    # Por ahora usamos texto (str) para las horas.
    start_time: str
    end_time: str
    
    # Fecha del bloque en formato ISO "YYYY-MM-DD"
    # Por defecto, se asigna la fecha de hoy
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    
    # "bool = False" significa que es opcional.
    completed: bool = False
    
    # Opcional, para recibir el ID desde MongoDB
    id: Optional[str] = None