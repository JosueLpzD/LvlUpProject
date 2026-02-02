"""
Script de prueba aislado para Gemini API.
Ejecutar con: python test_gemini.py
"""
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"🔑 API Key: {api_key[:15]}..." if api_key else "❌ No API key found")

if not api_key:
    exit(1)

print("🔌 Creando cliente...")
client = genai.Client(api_key=api_key)

print("📝 Enviando mensaje de prueba...")
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Responde SOLO con: Hola, soy Navi.'
    )
    print(f"✅ ÉXITO! Respuesta: {response.text}")
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}")
    print(f"   Detalle: {e}")
