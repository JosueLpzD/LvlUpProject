"""
Test directo del endpoint /navi/chat usando requests
"""
import requests
import json

url = "http://localhost:8000/navi/chat"
payload = {
    "message": "Hola Navi, necesito motivación para completar mis tareas",
    "context": {"level": 1, "xp": 0}
}

print("🔵 Enviando request a /navi/chat...")
print(f"📤 Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload)
    print(f"\n📊 Status Code: {response.status_code}")
    print(f"📥 Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        navi_response = response.json().get("response", "")
        print(f"\n✅ Navi dice: {navi_response}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Exception: {type(e).__name__}: {e}")
