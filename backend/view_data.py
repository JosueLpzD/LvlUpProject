import asyncio
from config.database import database
import pprint

async def view_data():
    print("🔎 Buscando bloques de tiempo en MongoDB (lvlup_db)...\n")
    
    # Buscar todos los documentos
    cursor = database.timeblocks.find({})
    blocks = await cursor.to_list(length=100)

    if not blocks:
        print("📭 La base de datos está vacía.")
        print("   (Prueba crear un hábito en el Frontend primero)")
    else:
        print(f"📦 Se encontraron {len(blocks)} bloques:\n")
        for block in blocks:
            # Convertir ObjectId a string para que se vea legible
            block['_id'] = str(block['_id'])
            pprint.pprint(block)
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(view_data())
