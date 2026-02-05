# 🤝 Contributing to LvlUp

Gracias por tu interés en contribuir a LvlUp!

---

## Estructura del Proyecto

```
lvlup/
├── frontend/     # Next.js 16 + React 19
├── backend/      # FastAPI + MongoDB
├── contracts/    # Smart Contracts (Foundry)
└── docs/         # Documentación
```

---

## Setup Inicial

```bash
# 1. Clonar repositorio
git clone https://github.com/JosueLpzD/LvlUpProject.git
cd lvlup

# 2. Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev

# 3. Backend
cd ../backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

# 4. Contracts (opcional)
cd ../contracts
forge install
forge build
```

---

## Guías Específicas

| Área | Documentación |
|------|---------------|
| Blockchain | [BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md) |
| Arquitectura | [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

## Convenciones de Código

### Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add wallet connection
fix: resolve NFT display bug
docs: update blockchain setup
```

### Branches
```
feature/wallet-integration
fix/reward-calculation
docs/update-readme
```

---

## Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, OnchainKit |
| Backend | FastAPI, MongoDB, Pydantic |
| Blockchain | Base (L2), Solidity, Foundry |
| Testing | Playwright, Foundry Tests |

---

## Preguntas?

Abre un issue o contacta al equipo.
