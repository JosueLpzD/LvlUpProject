---
name: blockchain-backend
description: >
  Blockchain integration patterns for backend signatures and verification.
  Trigger: When working with crypto signatures or reward claims.
allowed-tools: Read, Edit, Write
---

# Blockchain Backend Integration

## Generación de Firmas (EIP-712)

El backend genera firmas criptográficas que los usuarios envían a los contratos inteligentes.

### Flujo de Recompensas

```
1. Usuario completa hábito
2. Frontend notifica al Backend
3. Backend calcula recompensa y genera firma
4. Frontend envía firma al contrato
5. Contrato verifica y mintea tokens
```

### Ejemplo: Signature Generation

```python
# services/blockchain_signer.py
from eth_account import Account
from eth_account.messages import encode_typed_data
import os

SIGNER_PRIVATE_KEY = os.getenv("SIGNER_PRIVATE_KEY")

def generate_claim_signature(
    user_address: str,
    amount: int,
    nonce: int,
    contract_address: str
) -> str:
    """
    Genera una firma EIP-712 para reclamar recompensas.
    
    Args:
        user_address: Dirección del wallet del usuario
        amount: Cantidad de tokens a reclamar
        nonce: Nonce único para prevenir replay attacks
        contract_address: Dirección del contrato de rewards
    
    Returns:
        Firma hexadecimal
    """
    domain = {
        "name": "LvlUp Rewards",
        "version": "1",
        "chainId": 84532,  # Base Sepolia
        "verifyingContract": contract_address
    }
    
    types = {
        "Claim": [
            {"name": "user", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "nonce", "type": "uint256"}
        ]
    }
    
    message = {
        "user": user_address,
        "amount": amount,
        "nonce": nonce
    }
    
    typed_data = {
        "types": types,
        "primaryType": "Claim",
        "domain": domain,
        "message": message
    }
    
    account = Account.from_key(SIGNER_PRIVATE_KEY)
    signed = account.sign_typed_data(full_message=typed_data)
    
    return signed.signature.hex()
```

## Seguridad

- **NEVER** exponer la private key en logs o respuestas
- **ALWAYS** usar variables de entorno para keys
- **VALIDATE** direcciones de wallet antes de firmar
- **TRACK** nonces en la base de datos para prevenir replay attacks
