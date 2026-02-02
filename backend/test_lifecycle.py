import requests
import sys

BASE_URL = "http://localhost:8000"

def test_lifecycle():
    print("🔄 Iniciando prueba de ciclo de vida (CRUD)...")

    # 1. Crear un bloque
    print("\n1️⃣ Creando bloque de prueba...")
    payload = {
        "title": "Prueba de Persistencia",
        "habit_id": "test_habit",
        "start_time": "10:00",
        "end_time": "11:00",
        "completed": False
    }
    
    try:
        res_create = requests.post(f"{BASE_URL}/timeblocks", json=payload)
        if res_create.status_code != 200:
            print(f"❌ Error al crear: {res_create.text}")
            return
        
        data = res_create.json()
        block_id = data.get("id")
        print(f"✅ Bloque creado con ID: {block_id}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return

    # 2. Verificar estado inicial
    print("\n2️⃣ Verificando estado inicial...")
    # (En una app real haríamos GET /timeblocks/{id}, pero usaremos la lista)
    res_list = requests.get(f"{BASE_URL}/timeblocks")
    blocks = res_list.json()
    my_block = next((b for b in blocks if b["id"] == block_id), None)
    
    if my_block and my_block["completed"] == False:
        print("✅ El bloque está pendiente (completed: false)")
    else:
        print(f"❌ Error: El bloque no está como esperábamos: {my_block}")
        return

    # 3. Actualizar estado (PUT)
    print(f"\n3️⃣ Marcando como COMPLETADO (PUT /timeblocks/{block_id})...")
    res_update = requests.put(f"{BASE_URL}/timeblocks/{block_id}?completed=true")
    
    if res_update.status_code == 200:
        print("✅ Respuesta del servidor: OK")
    else:
        print(f"❌ Error al actualizar: {res_update.text}")
        return

    # 4. Verificar persistencia
    print("\n4️⃣ Verificando si el cambio persistió...")
    res_list_final = requests.get(f"{BASE_URL}/timeblocks")
    blocks_final = res_list_final.json()
    my_block_final = next((b for b in blocks_final if b["id"] == block_id), None)
    
    if my_block_final and my_block_final["completed"] == True:
        print("🎉 ¡ÉXITO! El bloque ahora aparece como completado en la base de datos.")
    else:
        print(f"❌ Error: El bloque sigue pendiente o no se actualizó: {my_block_final}")

if __name__ == "__main__":
    test_lifecycle()
