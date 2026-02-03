from fastapi import APIRouter, HTTPException
from config.database import database
from models.timeblock import TimeBlock
from typing import List
from bson import ObjectId

# Creamos el objeto router (nuestro mini-app)
timeblock_router = APIRouter()

@timeblock_router.post("/timeblocks")
async def create_timeblock(block: TimeBlock):
    # 1. Convertir el modelo a diccionario
    # 'dict()' transforma nuestro objeto Python a datos puros {clave: valor}
    # NOTA PRO: En versiones nuevas de Pydantic se prefiere block.model_dump(),
    # pero .dict() sigue funcionando por compatibilidad.
    block_dict = block.dict()
    
    # 2. Insertar en la base de datos
    # Usamos la colección "timeblocks". Si no existe, Mongo la crea.
    result = await database.timeblocks.insert_one(block_dict)
    
    # 3. Confirmar éxito con el ID generado
    return {"id": str(result.inserted_id), "message": "Bloque creado"}

@timeblock_router.get("/timeblocks", response_model=List[TimeBlock])
async def get_timeblocks():
    # 1. Buscar todos los documentos
    # 'find({})' significa "búscalo todo". 'to_list(100)' limita a 100 resultados por seguridad.
    blocks = await database.timeblocks.find({}).to_list(100)
    
    # FastAPI se encarga automágicamente de convertirlos a JSON
    # Truco: Mapeamos el "_id" de Mongo al "id" de nuestro modelo
    for block in blocks:
        block["id"] = str(block["_id"])
    return blocks

@timeblock_router.put("/timeblocks/{id}")
async def update_timeblock(id: str, completed: bool):
    # 1. Verificar ID válido
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # 2. Actualizar en Mongo
    # $set es el operador para "modificar solo esto y dejar lo demás igual"
    result = await database.timeblocks.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": {"completed": completed}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
        
    return {"message": "Estado actualizado correctamente"}

@timeblock_router.put("/timeblocks/{id}/duration")
async def update_timeblock_duration(id: str, start_time: str, end_time: str):
    """
    Actualiza el tiempo de inicio y fin de un bloque.
    Esto permite persistir cambios de duración cuando el usuario expande o reduce un bloque.
    """
    # 1. Verificar ID válido
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # 2. Actualizar ambos campos en Mongo
    result = await database.timeblocks.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": {"start_time": start_time, "end_time": end_time}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
        
    return {"message": "Duración actualizada correctamente"}

@timeblock_router.delete("/timeblocks/{id}")
async def delete_timeblock(id: str):
    # 1. Validar ID de MongoDB
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # 2. Intentar borrar
    result = await database.timeblocks.delete_one({"_id": ObjectId(id)})
    
    # 3. Verificar si se borró algo
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
        
    return {"message": "Bloque eliminado correctamente"}