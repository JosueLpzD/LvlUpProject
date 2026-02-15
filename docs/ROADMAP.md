# 🗺️ LvlUp — Roadmap hacia Prototipo Funcional

> **Objetivo**: Llevar LvlUp desde su estado actual a un prototipo funcional
> donde un usuario pueda: crear tareas, cumplir hábitos, stakear tokens,
> ganar/perder recompensas, y ver su progreso — todo conectado end-to-end.

**Fecha**: Febrero 2026
**Última actualización**: 12 de Febrero 2026

---

## 📊 Estado Actual del Proyecto

### ✅ Lo que YA funciona

| Capa | Componente | Estado |
|------|-----------|--------|
| **Frontend** | TimeBlockPlanner (crear/editar/completar tareas) | ✅ Conectado a MongoDB |
| **Frontend** | WeeklyCalendarView (calendario semanal) | ✅ Conectado a MongoDB |
| **Frontend** | CharacterHUD (XP, nivel, oro) | ⚠️ Solo localStorage |
| **Frontend** | NaviFairy (asistente IA con Gemini) | ✅ Conectado al backend |
| **Frontend** | FloatingPomodoro (timer) | ✅ Funcional local |
| **Frontend** | ConnectWallet + WalletInfo (OnchainKit) | ✅ Conecta wallet |
| **Frontend** | ActiveQuestBoard, SkillTrack | ⚠️ Solo localStorage |
| **Frontend** | LootShop (tienda) | ❌ Datos hardcoded, sin lógica real |
| **Backend** | TimeBlock CRUD (`/timeblocks`) | ✅ Funcional |
| **Backend** | Navi Chat (`/navi/chat`) | ✅ Funcional |
| **Backend** | Config (`/config`) | ✅ Funcional |
| **Backend** | Rewards con firmas (`/rewards/*`) | ✅ Funcional |
| **Backend** | Staking endpoints (`/staking/*`) | ✅ Funcional (7 endpoints) |
| **Contratos** | LvlUpToken.sol (ERC-20) | ✅ Compilado + 22 tests |
| **Contratos** | HabitStaking.sol (Stake-to-Earn) | ✅ Compilado + 27 tests |
| **Contratos** | Deploy.s.sol | ✅ Listo |

### ❌ Gaps Identificados (Lo que FALTA)

1. **gameStore** usa `localStorage` → no sincroniza con MongoDB ni blockchain
2. **No hay servicio de staking en frontend** (`stakingService.ts` no existe)
3. **No hay UI de staking** (no hay componente para stakear/reclamar)
4. **Contratos no están deployados** a Base Sepolia (testnet)
5. **No hay integración automática** hábito completado → reporte al contrato de staking
6. **LootShop** tiene datos hardcoded y `buyReward()` está vacío (TODO)
7. **No hay autenticación/identificación** de usuario (user_id es placeholder)
8. **No hay ABI del contrato** en el frontend para interactuar on-chain
9. **ARCHITECTURE.md** está desactualizado (no menciona staking)

---

## 🚀 Fases para Prototipo Funcional

---

### Fase 5: Deploy de Contratos a Base Sepolia (DONE)

**Objetivo**: Subir los contratos a la testnet para que sean accesibles públicamente.

- [x] Obtener ETH de testnet (faucet).
- [x] Configurar `contracts/.env` con `PRIVATE_KEY` y `BASE_SEPOLIA_RPC_URL`.
- [x] Ejecutar script de deploy (`forge script`).
- [x] Verificar contratos en BaseScan (opcional).
- [x] Registrar direcciones de contratos deployados. | Backend | `contracts/.env`, `docs/` |
| Verificar contratos en BaseScan | Backend | N/A |
| Crear archivo de constantes con direcciones | Ambos | `frontend/src/lib/contracts.ts`, `backend/.env` |

**Comando de deploy**:
```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast --verify
```

**Resultado**: Direcciones de contratos deployados y verificados en BaseScan.

---

### Fase 6: Integración Frontend ↔ Smart Contracts
> **Meta**: El frontend puede leer/escribir en los smart contracts directamente

| Tarea | Agente | Archivos |
|-------|--------|----------|
| Exportar ABIs de contratos (`forge build` genera JSON) | Backend | `contracts/out/` |
| Crear `contracts.ts` con ABIs y direcciones | Frontend | `frontend/src/lib/contracts.ts` |
| Crear `stakingService.ts` (llamadas al backend `/staking/*`) | Frontend | `frontend/src/services/stakingService.ts` |
| Crear hook `useStaking.ts` (estado de stake del usuario) | Frontend | `frontend/src/hooks/blockchain/useStaking.ts` |
| Crear hook `useTokenBalance.ts` (balance de $LVLUP) | Frontend | `frontend/src/hooks/blockchain/useTokenBalance.ts` |

**Dependencias**: Fase 5 completada (direcciones de contratos)

---

### Fase 7: UI de Staking
> **Meta**: El usuario puede stakear tokens, ver progreso, y reclamar desde la app

| Tarea | Agente | Archivos |
|-------|--------|----------|
| Crear componente `StakingPanel.tsx` (formulario de stake) | Frontend | `frontend/src/components/web3/StakingPanel.tsx` |
| Crear componente `StakeProgress.tsx` (barra de progreso hábitos) | Frontend | `frontend/src/components/web3/StakeProgress.tsx` |
| Crear componente `ClaimRewards.tsx` (botón de claim + resultados) | Frontend | `frontend/src/components/web3/ClaimRewards.tsx` |
| Integrar paneles de staking en `page.tsx` o crear página `/staking` | Frontend | `frontend/src/app/page.tsx` o `frontend/src/app/staking/page.tsx` |
| Mostrar balance de $LVLUP en `CharacterHUD` | Frontend | `frontend/src/components/dashboard/CharacterHUD.tsx` |

**Wireframe de StakingPanel**:
```
┌─────────────────────────────────────┐
│ 🔒 Stake-to-Earn                   │
│                                     │
│ Balance: 150 $LVLUP                │
│                                     │
│ Cantidad: [____100____] $LVLUP     │
│ Hábitos:  [____5______] por semana │
│                                     │
│ [    🔒 Stakear Tokens    ]        │
│                                     │
│ ─── Stake Activo ───                │
│ Stakeado: 100 $LVLUP               │
│ Progreso: ████████░░ 3/5 (60%)     │
│ Termina: 19 Feb 2026               │
│                                     │
│ [   💰 Reclamar Recompensas   ]    │
└─────────────────────────────────────┘
```

---

### Fase 8: Integración Automática Hábito → Staking
> **Meta**: Cuando el usuario completa un timeblock, automáticamente se reporta al contrato de staking

| Tarea | Agente | Archivos |
|-------|--------|----------|
| Modificar `updateStatus()` en timeblock_routes para llamar a `staking_service.report_habit()` | Backend | `backend/routes/timeblock_routes.py` |
| Frontend: al marcar tarea como completada, llamar `/staking/report-habit` | Frontend | `frontend/src/services/timeblockService.ts`, `frontend/src/components/productivity/TimeBlockPlanner.tsx` |
| Agregar notificación visual cuando se reporta un hábito al stake | Frontend | `frontend/src/components/productivity/TimeBlockPlanner.tsx` |

**Flujo completo**:
```
Usuario marca tarea ✅ → Frontend llama PUT /timeblocks/{id}
                        → Backend actualiza MongoDB
                        → Backend llama report_habit() automáticamente
                        → Se actualiza contador en staking_sessions
                        → Frontend muestra: "¡Hábito 3/5 reportado! 🎯"
```

---

### Fase 9: Sistema de Identidad de Usuario
> **Meta**: Identificar al usuario de forma consistente entre frontend, backend y blockchain

| Tarea | Agente | Archivos |
|-------|--------|----------|
| Usar `wallet address` como user_id principal (en vez de placeholder) | Ambos | Múltiples archivos |
| Crear endpoint `POST /users/register` (asociar wallet con perfil) | Backend | `backend/routes/user_routes.py`, `backend/models/user.py` |
| Migrar `gameStore` de localStorage a MongoDB (persistir XP, nivel, oro) | Frontend + Backend | `frontend/src/lib/store/gameStore.ts`, `backend/routes/user_routes.py` |
| Crear hook `useUser.ts` que combine datos de MongoDB + wallet | Frontend | `frontend/src/hooks/useUser.ts` |

---

### Fase 10: Polish del Prototipo
> **Meta**: Pulir la experiencia para que sea usable día a día

| Tarea | Agente | Archivos |
|-------|--------|----------|
| Conectar LootShop con datos reales (recompensas personalizables) | Frontend + Backend | `LootShop.tsx`, nuevo endpoint |
| Notificaciones/toasts cuando ocurren eventos blockchain | Frontend | Componente de notificaciones |
| Manejo de errores y estados de carga en todos los componentes web3 | Frontend | Componentes `web3/` |
| Actualizar ARCHITECTURE.md con staking y nuevos flujos | Backend | `docs/ARCHITECTURE.md` |
| Tests E2E del flujo completo (stake → hábito → claim) | Ambos | Tests |

---

## 📋 Resumen de Prioridades

```
Fase 5  → Deploy contratos        [Backend]    ⏱️ ~30 min
Fase 6  → Integración FE ↔ SC     [Frontend]   ⏱️ ~2 horas
Fase 7  → UI de Staking           [Frontend]   ⏱️ ~3 horas
Fase 8  → Auto-reporte hábitos    [Ambos]      ⏱️ ~1 hora
Fase 9  → Identidad de usuario    [Ambos]      ⏱️ ~2 horas
Fase 10 → Polish                  [Ambos]      ⏱️ ~2 horas
```

> [!IMPORTANT]
> **Las fases 5-8 son CRÍTICAS para el prototipo funcional.**
> Las fases 9-10 son mejoras para hacerlo usable en el día a día.

---

## 🔗 Referencias de Archivos Clave

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/page.tsx` | Página principal |
| `frontend/src/components/layout/AppShell.tsx` | Layout con CharacterHUD |
| `frontend/src/components/productivity/TimeBlockPlanner.tsx` | Planificador de tareas |
| `frontend/src/components/web3/ConnectWallet.tsx` | Conexión de wallet |
| `frontend/src/services/timeblockService.ts` | Servicio de timeblocks |
| `frontend/src/lib/store/gameStore.ts` | Estado del juego (Zustand, localStorage) |
| `frontend/src/hooks/blockchain/useBlockchainInfo.ts` | Hook de info blockchain |
| `frontend/src/providers/Web3Provider.tsx` | Provider de OnchainKit |

### Backend
| Archivo | Descripción |
|---------|-------------|
| `backend/main.py` | Punto de entrada FastAPI |
| `backend/routes/timeblock_routes.py` | CRUD de timeblocks |
| `backend/routes/staking_routes.py` | 7 endpoints de staking |
| `backend/routes/rewards_routes.py` | Claims con firmas |
| `backend/services/staking_service.py` | Lógica de staking |
| `backend/services/blockchain_signer.py` | Firmas criptográficas |
| `backend/config/database.py` | Conexión MongoDB |

### Contratos
| Archivo | Descripción |
|---------|-------------|
| `contracts/src/tokens/LvlUpToken.sol` | Token ERC-20 ($LVLUP) |
| `contracts/src/rewards/HabitStaking.sol` | Contrato Stake-to-Earn |
| `contracts/script/Deploy.s.sol` | Script de deploy |
| `contracts/test/LvlUpToken.t.sol` | 22 tests del token |
| `contracts/test/HabitStaking.t.sol` | 27 tests del staking |
