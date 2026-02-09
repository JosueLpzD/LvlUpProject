---
name: python
description: >
  Python 3.9+ best practices and patterns.
  Trigger: When writing Python code in the backend.
allowed-tools: Read, Edit, Write
---

# Python Best Practices

## Type Hints

- **ALWAYS** use type hints for function parameters and returns
- **USE** `Optional[T]` or `T | None` for nullable types
- **USE** typing module for complex types

```python
from typing import Optional, List, Dict

def process_items(items: List[str], limit: Optional[int] = None) -> Dict[str, int]:
    """Procesa una lista de items y retorna conteo."""
    result: Dict[str, int] = {}
    # lógica aquí
    return result
```

## Async/Await

- **USE** async for I/O operations (DB, HTTP, files)
- **NEVER** use blocking calls in async functions
- **USE** `asyncio.gather()` for concurrent operations

```python
import asyncio

async def fetch_user_data(user_id: str) -> dict:
    """Obtiene datos del usuario de forma asíncrona."""
    # Ejecutar múltiples queries en paralelo
    user, preferences = await asyncio.gather(
        db.users.find_one({"_id": user_id}),
        db.preferences.find_one({"user_id": user_id})
    )
    return {"user": user, "preferences": preferences}
```

## Docstrings

- **ALWAYS** document public functions
- **USE** descripción breve + parámetros si es complejo

```python
async def calculate_reward(habit_id: str, multiplier: float = 1.0) -> int:
    """
    Calcula la recompensa por completar un hábito.
    
    Args:
        habit_id: ID único del hábito completado
        multiplier: Multiplicador de bonificación (default: 1.0)
    
    Returns:
        Cantidad de tokens a recompensar
    """
    pass
```

## Virtual Environment

- **ALWAYS** work within the virtual environment
- **ACTIVATE** with: `.\\venv\\Scripts\\Activate.ps1` (Windows)
- **INSTALL** packages with: `pip install package_name`
