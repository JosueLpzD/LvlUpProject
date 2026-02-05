# 🎮 LvlUp - Productivity App

Aplicación de productividad gamificada con recompensas blockchain.

---

## 🏗️ Estructura del Proyecto

```
lvlup/
├── frontend/     # Next.js 16 + React 19
├── backend/      # FastAPI + MongoDB
├── contracts/    # Smart Contracts (Foundry + Solidity)
└── docs/         # Documentación
```

---

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Contracts (Requiere Foundry)
```bash
cd contracts
forge install
forge build
```

---

## 🔗 Blockchain Integration

Este proyecto usa **Base** (Layer 2 de Coinbase) para recompensas on-chain.

| Feature | Descripción |
|---------|-------------|
| 💰 $LVLUP Token | Token ERC-20 de recompensas |
| 🏆 Achievement NFTs | NFTs por logros especiales |
| 🔐 Secure Claims | Sistema de claims con firma backend |

### Stack Web3
- **OnchainKit** v1.0.0 (SDK oficial de Coinbase)
- **Wagmi** + **Viem** (React hooks para blockchain)
- **Foundry** (Smart contract development)

### Setup Blockchain
Ver [docs/BLOCKCHAIN_SETUP.md](./docs/BLOCKCHAIN_SETUP.md)

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| [BLOCKCHAIN_SETUP.md](./docs/BLOCKCHAIN_SETUP.md) | Configurar wallet y entorno |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Guía para contribuidores |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitectura del sistema |

---

## 🛠️ Tech Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, OnchainKit |
| Backend | FastAPI, MongoDB, Pydantic |
| Blockchain | Base (L2), Solidity 0.8.24, Foundry |

---

## 📄 License

MIT
