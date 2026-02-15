import requests
import json

BASE_URL = "http://localhost:8000"

def test_settlement():
    print("🧪 Testeando Endpoint de Liquidación...")
    
    # Payload simulado
    payload = {
        "user_address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", # Vitalik's address as dummy
        "week_id": 1,  # Semana actual o default
        "chain_id": 84532
    }
    
    try:
        response = requests.post(f"{BASE_URL}/finance/settlement/sign", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            amount = int(data['amount_to_return'])
            eth_amount = amount / 10**18
            
            print(f"✅ Respuesta Exitosa:")
            print(f"   - Firma: {data['signature'][:10]}...")
            print(f"   - Monto a devolver: {amount} Wei ({eth_amount} ETH)")
            
            if eth_amount == 0.9:
                print("   - ✅ Lógica Correcta: Penalización aplicada (0 completados).")
            elif eth_amount >= 1.0:
                print("   - ⚠️ Lógica: Devolución completa (¿Tienes hábitos completados?).")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    test_settlement()
