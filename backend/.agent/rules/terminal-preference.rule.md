---
trigger: always_on
---

# 🖥️ Regla de Terminal: Git Bash

**El usuario usa Git Bash como terminal principal en Windows.**

## Reglas Obligatorias

1. **SIEMPRE** dar instrucciones y comandos en sintaxis de **Bash/Git Bash**
2. **NUNCA** usar sintaxis de PowerShell a menos que sea absolutamente imposible hacerlo en Git Bash
3. Si un comando SOLO funciona en PowerShell, indicar explícitamente: "⚠️ Este comando requiere PowerShell"

## Ejemplos

✅ Correcto (Git Bash):
```bash
source venv/Scripts/activate
export MY_VAR="valor"
~/cloudflared.exe tunnel --url http://localhost:3000
```

❌ Incorrecto (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
$env:MY_VAR = "valor"
& "$env:USERPROFILE\cloudflared.exe" tunnel --url http://localhost:3000
```
