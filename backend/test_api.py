import requests
import sys

def test_api():
    base_url = "http://localhost:8000"
    
    print(f"⏳ Conectando a {base_url}...")
    
    # 1. Probar Root
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ GET / funciona correctamente.")
            print(f"   Respuesta: {response.json()}")
        else:
            print(f"❌ Error en GET /: {response.status_code}")
    except Exception as e:
        print(f"❌ No se pudo conectar al servidor: {e}")
        return

    # 2. Probar TimeBlocks
    try:
        response = requests.get(f"{base_url}/timeblocks")
        if response.status_code == 200:
            print("✅ GET /timeblocks funciona correctamente.")
            print(f"   Respuesta: {response.json()}")
        else:
            print(f"❌ Error en GET /timeblocks: {response.status_code}")
            return
            
    except Exception as e:
        print(f"❌ Error conectando a /timeblocks: {e}")
        return

    print("\n🎉 ¡Todo parece estar en orden!")

if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        import os
        print("Instalando requests...")
        os.system(f"{sys.executable} -m pip install requests")
        import requests
        
    test_api()
