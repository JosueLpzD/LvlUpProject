from pydantic import BaseModel
from typing import Optional

# BaseModel es la "plantilla maestra" de FastAPI para validar datos.
class TimeBlock(BaseModel):
    # Definimos los "ingredientes" obligatorios de nuestro plato.
    title: str
    habit_id: str # Para mantener el color/icono en el frontend
    
    # Por ahora usamos texto (str) para las horas.
    start_time: str
    end_time: str
    
    # "bool = False" significa que es opcional.
    completed: bool = False
    
    # Opcional, para recibir el ID desde MongoDB
    id: Optional[str] = None