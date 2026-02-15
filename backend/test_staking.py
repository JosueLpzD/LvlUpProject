"""
Test de los endpoints de Staking
Verifica que la Fase 4C funcione correctamente.
"""
import requests

BASE_URL = "http://localhost:8000"

def test_staking():
    print("=" * 60)
    print("🧪 TEST: Endpoints de Staking (Fase 4C)")
    print("=" * 60)
    
    # Test 1: Ver stake activo (no debería haber ninguno)
    print("\n📋 Test 1: GET /staking/active/test_user")
    r = requests.get(f"{BASE_URL}/staking/active/test_user")
    print(f"   Status: {r.status_code}")
    print(f"   Respuesta: {r.json()}")
    assert r.status_code == 200
    assert r.json()["has_active_stake"] == False
    print("   ✅ OK - No hay stake activo")
    
    # Test 2: Crear un stake
    print("\n📋 Test 2: POST /staking/stake")
    stake_data = {
        "user_address": "0x1234567890123456789012345678901234567890",
        "user_id": "test_user_stake",
        "amount": 100.0,
        "habits_required": 5,
        "transaction_hash": "0xfake_tx_hash_for_testing_123"
    }
    r = requests.post(f"{BASE_URL}/staking/stake", json=stake_data)
    print(f"   Status: {r.status_code}")
    data = r.json()
    print(f"   Mensaje: {data.get('message', data)}")
    assert r.status_code == 201
    print("   ✅ OK - Stake creado")
    
    # Test 3: Ver stake activo (ahora sí debería haber uno)
    print("\n📋 Test 3: GET /staking/active/test_user_stake")
    r = requests.get(f"{BASE_URL}/staking/active/test_user_stake")
    data = r.json()
    print(f"   Status: {r.status_code}")
    print(f"   Active: {data['has_active_stake']}")
    assert data["has_active_stake"] == True
    print("   ✅ OK - Stake activo encontrado")
    
    # Test 4: No se puede stakear dos veces
    print("\n📋 Test 4: POST /staking/stake (duplicado)")
    r = requests.post(f"{BASE_URL}/staking/stake", json=stake_data)
    print(f"   Status: {r.status_code}")
    assert r.status_code == 400
    print("   ✅ OK - Rechaza stake duplicado")
    
    # Test 5: Ver historial
    print("\n📋 Test 5: GET /staking/history/test_user_stake")
    r = requests.get(f"{BASE_URL}/staking/history/test_user_stake")
    data = r.json()
    print(f"   Status: {r.status_code}")
    print(f"   Sesiones: {data['total']}")
    assert data["total"] == 1
    print("   ✅ OK - Historial correcto")
    
    # Test 6: Ver estadísticas
    print("\n📋 Test 6: GET /staking/stats/test_user_stake")
    r = requests.get(f"{BASE_URL}/staking/stats/test_user_stake")
    data = r.json()
    print(f"   Status: {r.status_code}")
    print(f"   Active stake: {'Sí' if data.get('active_stake') else 'No'}")
    print("   ✅ OK - Estadísticas disponibles")
    
    # Test 7: API docs disponibles
    print("\n📋 Test 7: Verificar /docs")
    r = requests.get(f"{BASE_URL}/openapi.json")
    paths = r.json()["paths"]
    staking_paths = [p for p in paths if "/staking" in p]
    print(f"   Endpoints de staking registrados: {len(staking_paths)}")
    for p in staking_paths:
        print(f"     → {p}")
    assert len(staking_paths) >= 5
    print("   ✅ OK - Todos los endpoints registrados")
    
    print("\n" + "=" * 60)
    print("🎉 TODOS LOS TESTS PASARON CORRECTAMENTE")
    print("=" * 60)

if __name__ == "__main__":
    test_staking()
