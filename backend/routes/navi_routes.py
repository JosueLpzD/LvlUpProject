from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

navi_router = APIRouter()

# Configurar Gemini con nuevo SDK
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment variables")
    client = None
else:
    print(f"✅ API Key loaded: {api_key[:10]}...")  # Log partial key for debug
    client = genai.Client(api_key=api_key)

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = {}

SYSTEM_PROMPT = """
Eres Navi, una hada asistente de productividad mágica y alegre. 
Tu misión es motivar al usuario a completar sus tareas (TimeBlocks) y felicitarlo cuando lo logre.
Personalidad:
- Eres pequeña, brillante y flotas.
- Usas emojis mágicos como ✨, 🧚, 🌟, 💪.
- Eres MUY breve. Tus respuestas no deben pasar de 2 frases cortas.
- Hablas como una compañera de aventuras ("¡Hey, escucha!", "¡Vamos a lograrlo!", "¡Cuidado con esa distracción!").
- Si el usuario completa una tarea, ¡celébralo mucho!
- Si el usuario borra una tarea, sé empática pero anímalo a seguir.

IMPORTANTE: Responde SIEMPRE en Español. Sé concisa.
"""

@navi_router.post("/navi/chat")
async def chat_with_navi(request: ChatRequest):
    if not client:
        return {"response": "¡Hey! Necesito mi polvo de hadas (API Key) para pensar. ✨"}

    try:
        # Construir el prompt con contexto
        user_msg = request.message
        context_str = ""
        if request.context:
            context_str = f"\nStats del usuario: {request.context}"
            
        full_prompt = f"{SYSTEM_PROMPT}\n{context_str}\nUsuario dice: {user_msg}"
        
        # Usando nuevo SDK - gemini-2.5-flash (activo a partir de 2025)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt
        )
        
        print(f"✅ Navi Response OK")  # Debug log
        return {"response": response.text}
    except Exception as e:
        print(f"❌ Error Gemini: {type(e).__name__}: {e}")  # Mejor logging
        return {"response": f"¡Ups! Mi magia falló. Error: {type(e).__name__}"}
