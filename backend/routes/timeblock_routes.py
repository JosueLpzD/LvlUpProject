from fastapi import APIRouter, HTTPException
from config.database import database
from models.timeblock import TimeBlock
from typing import List
from bson import ObjectId
from datetime import datetime, timedelta

# Creamos el objeto router (nuestro mini-app)
timeblock_router = APIRouter()


# ============================================================
# ENDPOINT DE ESTADÍSTICAS - Datos para las gráficas de progreso
# ============================================================
@timeblock_router.get("/timeblocks/stats")
async def get_timeblock_stats():
    """
    Calcula estadísticas de los últimos 7 días para las gráficas de progreso.
    
    Analogía: Es como un reporte semanal de productividad.
    Por cada día, cuenta cuántas tareas planeaste y cuántas completaste.
    
    Retorna:
    - daily: lista de {date, total, completed} por cada día
    - weekly_total: total de bloques en la semana
    - weekly_completed: bloques completados en la semana
    - completion_rate: porcentaje de completados (0-100)
    - current_streak: días consecutivos con al menos 1 bloque completado
    """
    # 1. Generar las fechas de los últimos 7 días
    # Usamos una lista de strings en formato ISO "2026-02-12"
    today = datetime.now()
    dates = []
    for i in range(6, -1, -1):  # 6 días atrás hasta hoy
        d = today - timedelta(days=i)
        dates.append(d.strftime("%Y-%m-%d"))
    
    # 2. Traer TODOS los timeblocks de esos 7 días en una sola consulta
    # $in es como preguntar: "¿Tu fecha está en esta lista?"
    all_blocks = await database.timeblocks.find(
        {"date": {"$in": dates}}
    ).to_list(500)
    
    # 3. Contar totales y completados por día
    # Creamos un diccionario para acumular contadores por fecha
    daily_stats = {}
    for date_str in dates:
        daily_stats[date_str] = {"date": date_str, "total": 0, "completed": 0}
    
    for block in all_blocks:
        date_key = block.get("date", "")
        if date_key in daily_stats:
            daily_stats[date_key]["total"] += 1
            if block.get("completed", False):
                daily_stats[date_key]["completed"] += 1
    
    # 4. Convertir a lista ordenada por fecha
    daily_list = [daily_stats[d] for d in dates]
    
    # 5. Calcular totales semanales
    weekly_total = sum(d["total"] for d in daily_list)
    weekly_completed = sum(d["completed"] for d in daily_list)
    
    # 6. Tasa de cumplimiento (evitar división por cero)
    completion_rate = round((weekly_completed / weekly_total) * 100) if weekly_total > 0 else 0
    
    # 7. Calcular racha: días consecutivos (desde hoy hacia atrás)
    #    con al menos 1 bloque completado
    current_streak = 0
    for day in reversed(daily_list):
        if day["completed"] > 0:
            current_streak += 1
        else:
            break  # Primera vez que no hay completados, se rompe la racha
    
    return {
        "daily": daily_list,
        "weekly_total": weekly_total,
        "weekly_completed": weekly_completed,
        "completion_rate": completion_rate,
        "current_streak": current_streak
    }

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
async def get_timeblocks(date: str = None):
    """
    Obtiene timeblocks. Si se proporciona 'date', filtra por ese día.
    Formato date: "2026-02-05" (ISO 8601 YYYY-MM-DD)
    
    Ejemplos:
    - GET /timeblocks → Devuelve TODOS los bloques
    - GET /timeblocks?date=2026-02-05 → Solo bloques del 5 de febrero
    """
    # 1. Construir query de filtrado
    if date:
        # Filtrar por fecha específica
        query = {"date": date}
    else:
        # Sin filtro, devuelve todos (comportamiento actual para compatibilidad)
        query = {}
    
    # 2. Buscar documentos con el filtro aplicado
    blocks = await database.timeblocks.find(query).to_list(100)
    
    # 3. FastAPI se encarga automágicamente de convertirlos a JSON
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