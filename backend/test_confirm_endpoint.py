"""
Test del endpoint PATCH /rewards/confirm
Prueba el paso 3.5 - Registrar transaction_hash
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_confirm_endpoint():
    print("=" * 60)
    print("🧪 TEST: Endpoint PATCH /rewards/confirm")
    print("=" * 60)
    
    # 1. Probar con claim inexistente
    print("\n📋 Paso 1: Probar con task_id inexistente...")
    payload = {
        "user_id": "fake_user",
        "task_id": "fake_task_id",
        "transaction_hash": "0xabc123"
    }
    r = requests.patch(f"{BASE_URL}/rewards/confirm", json=payload)
    print(f"   Status: {r.status_code}")
    print(f"   Respuesta: {r.json()}")
    assert r.status_code == 404, f"Esperado 404, obtuvo {r.status_code}"
    print("   ✅ OK - Rechaza claim inexistente")
    
    # 2. Verificar que el endpoint existe accediendo a /docs
    print("\n📋 Paso 2: Verificar que el endpoint aparece en /docs...")
    r = requests.get(f"{BASE_URL}/openapi.json")
    if r.status_code == 200:
        openapi = r.json()
        paths = openapi.get("paths", {})
        if "/rewards/confirm" in paths:
            print("   ✅ OK - Endpoint registrado en OpenAPI")
        else:
            print("   ⚠️ Endpoint no encontrado en OpenAPI")
    
    print("\n" + "=" * 60)
    print("🎉 TESTS BÁSICOS PASARON")
    print("=" * 60)
    print("\n💡 Para probar completamente:")
    print("   1. Crea un claim primero con POST /rewards/claim")
    print("   2. Luego confirma con PATCH /rewards/confirm")

if __name__ == "__main__":
    test_confirm_endpoint()
