---
name: mongodb
description: >
  MongoDB patterns with Motor async driver for LvlUp.
  Trigger: When working with database operations.
allowed-tools: Read, Edit, Write
---

# MongoDB con Motor (Async Driver)

## Connection Pattern

```python
# config/database.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_DB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.lvlup  # Nombre de la base de datos
```

## Collections del Proyecto

- `timeblocks` - Bloques de tiempo y hábitos
- `users` - Información de usuarios
- `rewards` - Historial de recompensas

## CRUD Operations

### Create
```python
async def create_timeblock(data: dict) -> str:
    """Crea un nuevo timeblock y retorna su ID."""
    result = await db.timeblocks.insert_one(data)
    return str(result.inserted_id)
```

### Read
```python
from bson import ObjectId

async def get_timeblock(timeblock_id: str) -> dict | None:
    """Obtiene un timeblock por ID."""
    return await db.timeblocks.find_one({"_id": ObjectId(timeblock_id)})

async def get_user_timeblocks(user_id: str, limit: int = 50) -> list:
    """Obtiene timeblocks de un usuario."""
    cursor = db.timeblocks.find({"user_id": user_id}).limit(limit)
    return await cursor.to_list(length=limit)
```

### Update
```python
async def update_timeblock(timeblock_id: str, updates: dict) -> bool:
    """Actualiza un timeblock. Retorna True si se modificó."""
    result = await db.timeblocks.update_one(
        {"_id": ObjectId(timeblock_id)},
        {"$set": updates}
    )
    return result.modified_count > 0
```

### Delete
```python
async def delete_timeblock(timeblock_id: str) -> bool:
    """Elimina un timeblock. Retorna True si se eliminó."""
    result = await db.timeblocks.delete_one({"_id": ObjectId(timeblock_id)})
    return result.deleted_count > 0
```

## Queries Comunes

```python
# Buscar por fecha (rango)
from datetime import datetime, timedelta

yesterday = datetime.utcnow() - timedelta(days=1)
recent = await db.timeblocks.find(
    {"created_at": {"$gte": yesterday}}
).to_list(100)

# Agregaciones
pipeline = [
    {"$match": {"user_id": user_id}},
    {"$group": {"_id": "$habit_type", "count": {"$sum": 1}}}
]
stats = await db.timeblocks.aggregate(pipeline).to_list(None)
```
