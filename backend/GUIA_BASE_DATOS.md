# 🗺️ Guía: Creando la Memoria del Servidor (Base de Datos)

Esta guía te llevará paso a paso para conectar tu aplicación FastAPI con MongoDB. No solo copiaremos código, entenderemos **por qué** cada pieza va donde va.

### 🧠 El Concepto
Imagina que `main.py` es el mesero. Necesita un lugar donde guardar las comandas (TimeBlocks) permanentemente, no solo en su memoria de corto plazo. Ese lugar es **MongoDB**.

Para que hablen, necesitamos un teléfono (el driver `motor`) y una agenda de contactos (la configuración).

---

## Paso 1: Variables de Entorno (El Secreto)
Las direcciones de las bases de datos a veces tienen contraseñas. No queremos escribir eso directamente en el código python. Usaremos un archivo `.env`.

1.  En la carpeta `backend`, crea un archivo llamado `.env` (sí, empieza con punto).
2.  Adentro, escribe esto:
    ```properties
    MONGODB_URL=mongodb://localhost:27017
    DB_NAME=lvlup_db
    ```
    *Esto define dónde vive la base de datos y cómo se llamará tu "cajón" de archivos.*

---

## Paso 2: La Conexión (El Enchufe)
Ahora vamos a crear el código que lee ese secreto y enchufa el cable.

1.  Ve a la carpeta `backend/config`.
2.  Crea un archivo llamado `database.py`.
3.  **Tu Misión (Lógica a escribir):**
    *   Importa `AsyncIOMotorClient` de la librería `motor.motor_asyncio`.
    *   Define una variable `client` que use esa clase con tu `MONGODB_URL`.
    *   Define una variable `database` que seleccione tu `DB_NAME` desde el cliente.

    *💡 Pista: Necesitarás importar `os` y `dotenv` para leer el archivo .env, o simplemente escribir la URL directa por ahora si se te complica, pero lo profesional es usar .env.*

---

## Paso 3: El Modelo (El Molde)
MongoDB es flexible (puedes guardar lo que sea), pero tu código necesita orden. Vamos a definir qué "forma" tiene un TimeBlock.

1.  Ve a la carpeta `backend/models`.
2.  Crea un archivo llamado `timeblock.py`.
3.  **Tu Misión (Lógica a escribir):**
    *   Importa `BaseModel` de `pydantic`.
    *   Crea una clase llamada `TimeBlock` que herede de `BaseModel`.
    *   Define los atributos que necesitas. Para un bloque de tiempo, sugerimos:
        *   `title`: de tipo `str` (texto)
        *   `start_time`: de tipo `str` (o `datetime` si te animas)
        *   `end_time`: de tipo `str`
        *   `completed`: de tipo `bool` (verdadero/falso), con valor por defecto `False`.

---

## Paso 4: Verificación
Una vez creados estos archivos, no pasará nada "visible" todavía. El siguiente gran paso será crear una **Ruta** (endpoint) que use este modelo para guardar algo en la base de datos.

### 🧪 ¿Cómo sé si voy bien?
Por ahora, si `uvicorn` sigue corriendo sin errores en la terminal (sin letras rojas diciendo `ModuleNotFoundError`), ¡vas perfecto! Significa que tus archivos son sintácticamente correctos.
