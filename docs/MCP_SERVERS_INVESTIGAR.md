# 🔗 MCP Servers para Blockchain - Lista de Investigación

Esta lista contiene MCP Servers relevantes para desarrollo blockchain. 
**Investiga cada uno antes de instalar.**

---

## 🏆 Alta Prioridad

### 1. Blockchain MCP Server
- **Repo:** https://github.com/LimeChain/blockchain-mcp
- **Funciones:** 
  - `get-chains` - Lista de redes soportadas
  - `get-balance` - Balance de wallets
  - `read-contract` - Leer datos de contratos
  - `prepare-transaction` - Preparar transacciones
  - `send-transaction` - Enviar transacciones
- **Uso:** Interacción directa con blockchain desde agentes

---

### 2. Foundry MCP Server
- **Repo:** https://github.com/foundry-rs/foundry (buscar MCP)
- **Documentación:** https://mcp.so/server/foundry
- **Funciones:**
  - Compilar contratos con Forge
  - Ejecutar tests
  - Interactuar vía Cast
  - Local node con Anvil
- **Uso:** Desarrollo de smart contracts

---

### 3. rr-solidity (Claude Skill)
- **Repo:** https://mcpmarket.com (buscar rr-solidity)
- **Funciones:**
  - Desarrollo completo de contratos
  - Análisis con Slither
  - Testing con Foundry
  - Gas optimization
- **Uso:** Skill para Claude/agentes para Solidity

---

## 📊 Media Prioridad

### 4. Hive Intelligence MCP
- **URL:** cursor.directory (buscar Hive Intelligence)
- **Funciones:**
  - Market data crypto
  - Analytics DeFi
  - Portfolio tracking
- **Uso:** Analytics y datos on-chain

---

### 5. EVM Utils MCP
- **Repo:** https://mcpservers.org (buscar ethereum)
- **Funciones:**
  - `4byte` - Firmas de funciones
  - `abi-encode` / `abi-decode` - Codificación ABI
  - Vanity address generation
- **Uso:** Utilidades para desarrollo EVM

---

## 🔒 Herramientas de Seguridad (No MCP, pero útiles)

### Slither
- **Repo:** https://github.com/crytic/slither
- **Tipo:** Análisis estático de Solidity
- **Instalación:** `pip install slither-analyzer`

### MythX
- **URL:** https://mythx.io
- **Tipo:** Auditoría de seguridad automatizada
- **Uso:** Verificación pre-mainnet

### Aderyn
- **Repo:** https://github.com/Cyfrin/aderyn
- **Tipo:** Auditor de seguridad Rust
- **Uso:** Alternativa rápida a Slither

---

## 📝 Notas

- **Antes de instalar:** Revisa el código fuente de cada MCP
- **Seguridad:** Algunos requieren API keys o acceso a wallets
- **Compatibilidad:** Verifica que funcionen con tu versión de Antigravity

---

## Checklist de Investigación

- [ ] Revisar Blockchain MCP Server
- [ ] Revisar Foundry MCP Server
- [ ] Revisar rr-solidity Skill
- [ ] Revisar Hive Intelligence
- [ ] Revisar Slither (standalone)
