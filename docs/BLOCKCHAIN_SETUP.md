# 🔗 Blockchain Setup Guide

Guía para configurar el entorno de desarrollo blockchain para LvlUp.

---

## Requisitos Previos

- Node.js 18+ 
- Git
- [Foundry](https://getfoundry.sh) (para smart contracts)
- [MetaMask](https://metamask.io) o wallet compatible

---

## 1. Instalar Foundry (Windows)

```powershell
# Opción A: Usando foundryup (requiere WSL o Git Bash)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Opción B: Binarios precompilados
# Descarga desde: https://github.com/foundry-rs/foundry/releases
```

Verifica la instalación:
```bash
forge --version
```

---

## 2. Configurar MetaMask

### Agregar Base Sepolia (Testnet)

| Campo | Valor |
|-------|-------|
| Network Name | Base Sepolia |
| RPC URL | https://sepolia.base.org |
| Chain ID | 84532 |
| Currency Symbol | ETH |
| Block Explorer | https://sepolia.basescan.org |

### Obtener ETH de Prueba

1. Copia tu dirección de MetaMask
2. Ve a [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
3. Solicita ETH de prueba

---

## 3. Obtener API Keys

### OnchainKit API Key (Requerido)

1. Ve a [Coinbase Developer Platform](https://portal.cdp.coinbase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia el API Key

### Añadir a tu `.env.local`:

```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=tu_api_key
```

---

## 4. Variables de Entorno

Copia los archivos de ejemplo:

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env

# Contracts
cp contracts/.env.example contracts/.env
```

---

## 5. Instalar Dependencias de Contratos

```bash
cd contracts

# Instalar OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Compilar contratos
forge build
```

---

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `forge build` | Compilar contratos |
| `forge test -vvv` | Ejecutar tests |
| `forge coverage` | Ver cobertura de tests |

---

## Troubleshooting

### Error: "forge not found"
Foundry no está instalado o no está en PATH. Reinstala Foundry.

### Error: "ONCHAINKIT_API_KEY missing"
Asegúrate de tener `NEXT_PUBLIC_ONCHAINKIT_API_KEY` en `.env.local`

### Error: "Insufficient funds"
Necesitas ETH de testnet. Usa el faucet mencionado arriba.
