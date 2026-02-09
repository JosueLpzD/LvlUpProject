# 🎮 LvlUp - App de Productividad Gamificada

Una app que convierte tus tareas diarias en un juego con recompensas blockchain.

---

## 📋 ¿Qué necesito instalar antes?

Descarga e instala estos programas (haz clic en cada enlace):

| Programa | ¿Para qué sirve? | Descargar |
|----------|------------------|-----------|
| **Node.js** | Ejecutar el frontend | [👉 Descargar Node.js](https://nodejs.org) |
| **Python** | Ejecutar el backend | [👉 Descargar Python](https://python.org) |
| **MongoDB** | Base de datos | [👉 Descargar MongoDB](https://mongodb.com/try/download/community) |
| **Git** | Control de versiones | [👉 Descargar Git](https://git-scm.com) |

> 💡 **Tip**: Al instalar Python, marca la casilla **"Add Python to PATH"**.

---

## 🚀 Instalación (Solo la Primera Vez)

### Paso 1: Descargar el proyecto

Abre una terminal y escribe:
```bash
git clone https://github.com/JosueLpzD/LvlUpProject.git
cd LvlUpProject
```

### Paso 2: Instalar el Frontend

```bash
cd frontend
npm install
```

> ⏱️ Esto puede tardar unos minutos. Espera a que termine.

### Paso 3: Instalar el Backend

Primero, entra a la carpeta backend:
```bash
cd ../backend
```

Luego crea el entorno virtual de Python:
```bash
python -m venv venv
```

Ahora **activa el entorno** (elige según tu terminal):

| Terminal | Comando |
|----------|---------|
| **Git Bash** (Windows) | `source venv/Scripts/activate` |
| **PowerShell** (Windows) | `.\venv\Scripts\Activate.ps1` |
| **Mac / Linux** | `source venv/bin/activate` |

> ✅ Sabrás que funcionó cuando veas `(venv)` al inicio de tu línea.

Finalmente, instala las dependencias:
```bash
pip install -r requirements.txt
```

---

## 🖥️ Iniciar la App (Cada vez que trabajes)

Necesitas **2 terminales abiertas** al mismo tiempo:

### 🟢 Terminal 1: Frontend

```bash
cd frontend
npm run dev
```
📍 **Abre en tu navegador:** http://localhost:3000

---

### 🟣 Terminal 2: Backend

Elige los comandos según tu terminal:

#### 👉 Si usas **Git Bash** (Windows):
```bash
cd backend
source venv/Scripts/activate
uvicorn main:app --reload
```

#### 👉 Si usas **PowerShell** (Windows):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

#### 👉 Si usas **Mac o Linux**:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

📍 **API disponible en:** http://localhost:8000

> ✅ Sabrás que funciona cuando veas: `Uvicorn running on http://127.0.0.1:8000`

---

## ✅ Verificar que todo funciona

| Servicio | URL | Estado esperado |
|----------|-----|-----------------|
| Frontend | http://localhost:3000 | Ver la app |
| Backend | http://localhost:8000 | Ver `{"message": "LvlUp API"}` |
| API Docs | http://localhost:8000/docs | Documentación interactiva |

---

## ⚠️ Solución de Problemas Comunes

### ❌ "uvicorn: command not found"
**Problema:** El entorno virtual no está activado.

**Solución:** Activa el entorno primero:
```bash
# Git Bash
source venv/Scripts/activate

# PowerShell
.\venv\Scripts\Activate.ps1
```

---

### ❌ "cannot be loaded because running scripts is disabled"
**Problema:** PowerShell bloquea scripts.

**Solución:** Ejecuta este comando UNA vez:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### ❌ "Module not found" o "No module named..."
**Problema:** Faltan dependencias.

**Solución:** Reinstala:
```bash
# Frontend
cd frontend
npm install

# Backend (con venv activado)
cd backend
pip install -r requirements.txt
```

---

### ❌ La app no carga datos
**Problema:** El backend no está corriendo.

**Solución:** Verifica que ambas terminales estén activas:
- Terminal 1: Frontend corriendo ✅
- Terminal 2: Backend corriendo ✅

---

## 🔗 Configuración Blockchain (Opcional)

Solo necesitas esto si quieres usar las funciones de recompensas:

1. Obtén una API key en [Coinbase Developer Platform](https://portal.cdp.coinbase.com)
2. Crea el archivo `frontend/.env.local` con:
   ```
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=tu_api_key_aqui
   ```
3. Instala [MetaMask](https://metamask.io) o [Coinbase Wallet](https://www.coinbase.com/wallet)

Ver [docs/BLOCKCHAIN_SETUP.md](./docs/BLOCKCHAIN_SETUP.md) para más detalles.

---

## 🛠️ Tecnologías Usadas

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | FastAPI, MongoDB, Python |
| Blockchain | Base (L2 de Coinbase), Solidity |

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Cómo está organizado el código |
| [BLOCKCHAIN_SETUP.md](./docs/BLOCKCHAIN_SETUP.md) | Configurar wallet y blockchain |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Cómo contribuir al proyecto |

---

## 📄 Licencia

MIT - Puedes usar este código libremente.
