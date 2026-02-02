import asyncio
from config.database import database

async def test_connection():
    try:
        print("Intentando conectar a MongoDB...")
        await database.command("ping")
        print("EXITO! Conexión a MongoDB establecida correctamente.")
        print("Tu código ya puede guardar y leer datos.")
        return True
    except Exception as e:
        print("ERROR: No se pudo conectar.")
        print(f"Detalles del error: {e}")
        print("\nPistas para solucionar:")
        print("1. ¿Tienes el servicio de MongoDB corriendo en tu PC?")
        print("2. ¿La URL en .env es correcta? (mongodb://localhost:27017)")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())