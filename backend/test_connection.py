import asyncio
from config.database import database

# Esta función es asíncrona porque hablar con la BD toma tiempo
async def test_connection():
    try:
        print("⏳ Intentando conectar a MongoDB...")
        # El comando "ping" es la forma estándar de preguntar "¿Estás ahí?"
        await database.command("ping")
        print("✅ ¡ÉXITO! Conexión a MongoDB establecida correctamente.")
        print("   Tu código ya puede guardar y leer datos.")
    except Exception as e:
        print("❌ ERROR: No se pudo conectar.")
        print(f"   Detalles del error: {e}")
        print("\n💡 Pistas para solucionar:")
        print("   1. ¿Tienes el servicio de MongoDB corriendo en tu PC?")
        print("   2. ¿La URL en .env es correcta? (mongodb://localhost:27017)")

# Esto ejecuta la función cuando corres el archivo
if __name__ == "__main__":
    asyncio.run(test_connection())
