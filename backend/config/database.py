import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 1. Cargar las variables de entorno (los secretos en el archivo .env)
# Esto busca un archivo .env y carga su contenido como variables del sistema
load_dotenv()

# 2. Obtener la URL de conexión
# os.getenv funciona como preguntar: "¿Hay algo guardado bajo el nombre 'MONGODB_URL'?"
mongodb_url = os.getenv("MONGODB_URL")

# 3. Crear el Cliente (El Teléfono)
# AsyncIOMotorClient es el objeto que nos permite "llamar" a la base de datos de manera asíncrona
# (sin bloquear el resto de la aplicación mientras espera respuesta)
client = AsyncIOMotorClient(mongodb_url)

# 4. Seleccionar la Base de Datos (La Agenda)
# Elegimos la base de datos específica que vamos a usar
database_name = os.getenv("DB_NAME")
database = client[database_name]

# Explicación Lógica:
# Ahora, cada vez que otro archivo necesite datos, importará esta variable 'database'.
# Es como tener una tubería ya instalada hacia tu depósito de información.
