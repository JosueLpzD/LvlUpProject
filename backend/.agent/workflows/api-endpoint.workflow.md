---
name: api-endpoint
description: >
  Workflow guiado para crear nuevos endpoints en el backend de LvlUp.
---

# Workflow: Crear Nuevo Endpoint API

Use este workflow cuando el usuario pida:
- Crear un nuevo endpoint
- Agregar funcionalidad al API
- Exponer datos de la base de datos

## Pasos

1. **Definir el Modelo** (si aplica)
   - Crear o modificar modelos Pydantic en `models/`
   - Incluir validaciones necesarias
   - Documentar campos con `Field(description=...)`

2. **Crear el Router**
   - Si es un dominio nuevo, crear archivo en `routes/`
   - Si es existente, agregar al router correspondiente
   - Usar prefijo apropiado y tags

3. **Implementar Lógica**
   - Escribir la función del endpoint
   - Usar async/await para operaciones I/O
   - Manejar errores con HTTPException
   - Agregar comentarios explicativos

4. **Registrar en main.py**
   - Si es router nuevo, importar y agregar con `app.include_router()`

5. **Probar el Endpoint**
   - Iniciar servidor: `uvicorn main:app --reload`
   - Probar con curl o abrir `/docs` en navegador
   - Verificar respuestas y errores

6. **Documentar**
   - Agregar docstring a la función
   - Verificar que aparece correctamente en `/docs`

## Ejemplo de Estructura

```python
# models/example.py
from pydantic import BaseModel, Field

class ExampleCreate(BaseModel):
    name: str = Field(..., description="Nombre del ejemplo")
    value: int = Field(ge=0, description="Valor numérico positivo")

# routes/example_routes.py
from fastapi import APIRouter, HTTPException
from models.example import ExampleCreate

router = APIRouter(prefix="/examples", tags=["Examples"])

@router.post("/")
async def create_example(data: ExampleCreate):
    """Crea un nuevo ejemplo en la base de datos."""
    # lógica aquí
    return {"status": "created", "data": data.dict()}
```
