"""
Servicio Extra Life 🪙

Contiene la lógica de negocio del sistema "Extra Life".

Reglas del juego:
1. PRIMER USO → El usuario SIEMPRE se salva (free pass)
2. SEGUNDO USO EN ADELANTE → Coin flip 50/50 (cara = salvado, cruz = penalizado)

Analogía: Imagina que tienes una moneda mágica en un arcade.
La primera ficha es de cortesía — siempre ganas.
Después, cada vez que la insertas, es suerte pura: cara o cruz.
"""

import random
from datetime import datetime
from config.database import extra_lives_collection
from models.extra_life import ExtraLifeResult


async def use_extra_life(user_id: str) -> ExtraLifeResult:
    """
    Ejecuta la lógica del Extra Life para un usuario.
    
    Flujo:
    1. Contar cuántas veces el usuario ya usó Extra Life
    2. Si es la primera vez → resultado = "saved" (sin moneda)
    3. Si NO es la primera vez → lanzar moneda (50/50)
    4. Guardar el resultado en MongoDB
    5. Retornar el resultado
    
    Args:
        user_id: ID del usuario que invoca el Extra Life
    
    Returns:
        ExtraLifeResult con el resultado del intento
    """
    
    # 1. Contar usos previos del usuario
    # Preguntamos a MongoDB: "¿Cuántos documentos tiene este user_id?"
    previous_uses = await extra_lives_collection.count_documents({"user_id": user_id})
    
    # 2. El número de intento actual es el siguiente
    attempt_number = previous_uses + 1
    
    # 3. Determinar resultado según las reglas
    if attempt_number == 1:
        # PRIMER USO: siempre gana (free pass de bienvenida)
        # No hay coin flip — es un regalo
        result = "saved"
        coin_flip = None  # No hubo lanzamiento
    else:
        # SEGUNDO USO EN ADELANTE: coin flip 50/50
        # random.choice es como lanzar una moneda al aire
        # True = cara (salvado), False = cruz (penalizado)
        coin_flip = random.choice([True, False])
        result = "saved" if coin_flip else "penalized"
    
    # 4. Crear el registro del resultado
    extra_life_record = ExtraLifeResult(
        user_id=user_id,
        attempt_number=attempt_number,
        result=result,
        coin_flip=coin_flip,
        used_at=datetime.utcnow()
    )
    
    # 5. Guardar en MongoDB (colección "extra_lives")
    # .dict() convierte el modelo Pydantic a un diccionario {clave: valor}
    record_dict = extra_life_record.dict(exclude={"id"})
    insert_result = await extra_lives_collection.insert_one(record_dict)
    
    # 6. Asignar el ID generado por MongoDB
    extra_life_record.id = str(insert_result.inserted_id)
    
    return extra_life_record


async def get_extra_life_history(user_id: str) -> list:
    """
    Obtiene el historial completo de usos de Extra Life de un usuario.
    
    Analogía: Es como revisar el registro de todas las veces que
    usaste tu moneda mágica — cuándo, qué intento fue, y si ganaste o perdiste.
    
    Args:
        user_id: ID del usuario
    
    Returns:
        Lista de ExtraLifeResult ordenados por fecha
    """
    # Buscar todos los registros del usuario, ordenados por fecha
    cursor = extra_lives_collection.find(
        {"user_id": user_id}
    ).sort("used_at", 1)  # 1 = orden ascendente (más antiguo primero)
    
    records = await cursor.to_list(100)
    
    # Mapear _id de MongoDB al campo id del modelo
    for record in records:
        record["id"] = str(record["_id"])
    
    return records


async def get_extra_life_count(user_id: str) -> int:
    """
    Retorna cuántas veces el usuario ha usado Extra Life.
    Útil para saber si el próximo uso es gratuito o coin flip.
    """
    return await extra_lives_collection.count_documents({"user_id": user_id})
