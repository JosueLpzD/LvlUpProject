---
name: fastapi
description: >
  FastAPI patterns and best practices for LvlUp backend.
  Trigger: When creating routes, endpoints, or API logic.
allowed-tools: Read, Edit, Write
---

# FastAPI Best Practices

## Router Structure

- **ALWAYS** use APIRouter for modular routes
- **Prefix** routers with their domain (e.g., `/rewards`, `/timeblock`)
- **Group** related endpoints in the same router file

```python
# routes/example_routes.py
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/example", tags=["Example"])

@router.get("/")
async def get_all_examples():
    """Obtiene todos los ejemplos."""
    pass

@router.post("/")
async def create_example(data: ExampleCreate):
    """Crea un nuevo ejemplo."""
    pass
```

## Request/Response Models

- **ALWAYS** use Pydantic models for request bodies
- **ALWAYS** use Pydantic models for complex responses
- **USE** `response_model` parameter for automatic documentation

```python
from pydantic import BaseModel

class ExampleCreate(BaseModel):
    name: str
    value: int

class ExampleResponse(BaseModel):
    id: str
    name: str
    value: int
    created_at: datetime

@router.post("/", response_model=ExampleResponse)
async def create_example(data: ExampleCreate):
    # ...
```

## Error Handling

- **USE** HTTPException for API errors
- **PROVIDE** meaningful error messages
- **USE** appropriate status codes

```python
from fastapi import HTTPException

@router.get("/{item_id}")
async def get_item(item_id: str):
    item = await db.find_one({"_id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item
```

## Dependency Injection

- **USE** Depends() for shared logic
- **COMMON** dependencies: database connections, auth, validation

```python
from fastapi import Depends

async def get_db():
    # Return database connection
    pass

@router.get("/")
async def get_items(db = Depends(get_db)):
    return await db.items.find().to_list(100)
```
