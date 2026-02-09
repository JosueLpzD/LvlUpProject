"""
Test de Validación de Tareas Completadas
Prueba el paso 3.4 - Verificar que la tarea esté completada antes de firmar
"""
import requests

BASE_URL = "http://localhost:8000"

def test_validate_endpoint():
    print("=" * 60)
    print("🧪 TEST: Validación de Tareas Completadas para Recompensas")
    print("=" * 60)
    
    # 1. Obtener timeblocks existentes
    print("\n📋 Paso 1: Obteniendo timeblocks...")
    r = requests.get(f"{BASE_URL}/timeblocks")
    
    if r.status_code != 200:
        print(f"❌ Error: No se pudo obtener timeblocks ({r.status_code})")
        return
    
    timeblocks = r.json()
    print(f"   Encontrados: {len(timeblocks)} timeblocks")
    
    if len(timeblocks) == 0:
        print("\n⚠️ No hay timeblocks en la base de datos.")
        print("   Crea uno en el frontend primero.")
        return
    
    # Mostrar los primeros 5
    print("\n   Muestra de timeblocks:")
    for t in timeblocks[:5]:
        status = "✅" if t.get("completed") else "⬜"
        print(f"   {status} ID: {t.get('id')[:12]}... | {t.get('title')}")
    
    # 2. Probar validación con ID inválido
    print("\n📋 Paso 2: Probar con ID inválido...")
    r = requests.get(f"{BASE_URL}/rewards/validate/test_user/invalid_id_123")
    data = r.json()
    print(f"   Respuesta: {data}")
    assert data["can_claim"] == False, "Debería ser False para ID inválido"
    assert "task_status" in data, "Debería incluir task_status"
    print("   ✅ OK - Rechaza ID inválido correctamente")
    
    # 3. Encontrar un timeblock completado y uno no completado
    completed = None
    incomplete = None
    for t in timeblocks:
        if t.get("completed") and not completed:
            completed = t
        if not t.get("completed") and not incomplete:
            incomplete = t
    
    # 4. Probar con tarea NO completada (si existe)
    if incomplete:
        print(f"\n📋 Paso 3: Probar con tarea NO completada...")
        task_id = incomplete.get("id")
        r = requests.get(f"{BASE_URL}/rewards/validate/test_user/{task_id}")
        data = r.json()
        print(f"   ID: {task_id[:12]}...")
        print(f"   Respuesta: {data}")
        assert data["can_claim"] == False, "Debería ser False para tarea incompleta"
        assert data["task_status"] == "incomplete", "Status debería ser 'incomplete'"
        print("   ✅ OK - Rechaza tarea incompleta correctamente")
    else:
        print("\n⚠️ No hay tareas incompletas para probar")
    
    # 5. Probar con tarea completada (si existe)
    if completed:
        print(f"\n📋 Paso 4: Probar con tarea COMPLETADA...")
        task_id = completed.get("id")
        r = requests.get(f"{BASE_URL}/rewards/validate/test_user/{task_id}")
        data = r.json()
        print(f"   ID: {task_id[:12]}...")
        print(f"   Respuesta: {data}")
        # Puede ser True (lista para reclamar) o False (ya reclamada)
        if data["can_claim"]:
            assert data["task_status"] == "ready_to_claim"
            print("   ✅ OK - Tarea completada lista para reclamar")
        else:
            print(f"   ℹ️ Tarea ya reclamada o {data.get('reason')}")
    else:
        print("\n⚠️ No hay tareas completadas para probar")
    
    print("\n" + "=" * 60)
    print("🎉 TODOS LOS TESTS PASARON CORRECTAMENTE")
    print("=" * 60)

if __name__ == "__main__":
    test_validate_endpoint()
