# 🤖 Sistema de Agentes Especializados - LvlUp

Este proyecto usa **agentes especializados** de Antigravity para trabajo paralelo.

## Cómo Funciona

Cada carpeta principal tiene su propia configuración de agente (`.agent/`):

| Carpeta | Agente | Especialización |
|---------|--------|-----------------|
| `frontend/` | Agente Frontend | Next.js, React, Tailwind, Web3 |
| `backend/` | Agente Backend | FastAPI, Python, MongoDB |

## Trabajo en Paralelo

Para trabajar en paralelo sin saturar el contexto:

1. **Abrir Frontend en una ventana**:
   - `File > Open Folder > frontend/`
   - Este agente solo carga skills de frontend

2. **Abrir Backend en otra ventana**:
   - `File > Open Folder > backend/`
   - Este agente solo carga skills de backend

## Verificar el Agente

Pregunta al agente: *"¿Cuál es tu rol?"*

- **Frontend** responderá: "Soy el Agente Frontend de LvlUp"
- **Backend** responderá: "Soy el Agente Backend de LvlUp"

## Estructura de Agentes

```
frontend/.agent/
├── skills/          # 11 skills (nextjs, react, tailwind, ui, web3...)
├── rules/           # Reglas de comportamiento
└── workflows/       # Flujos de trabajo

backend/.agent/
├── skills/          # 4 skills (fastapi, python, mongodb, blockchain)
├── rules/           # Reglas de comportamiento
└── workflows/       # Flujos de trabajo (api-endpoint)
```

## Límites de Responsabilidad

Los agentes son **flexibles**: advertirán si pides algo fuera de su dominio,
pero pueden ayudarte si es necesario. Para mejor resultado, usa el agente correcto.
