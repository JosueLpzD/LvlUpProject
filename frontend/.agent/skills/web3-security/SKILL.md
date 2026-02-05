---
name: web3-security
description: Security best practices for blockchain development. Use when handling sensitive operations, keys, or auditing code.
---

# Web3 Security Skill

## Trigger
Use this skill when:
- Handling private keys or signatures
- Deploying to mainnet
- Auditing smart contracts
- Implementing authentication

---

## Golden Rules

| # | Rule | Why |
|---|------|-----|
| 1 | NEVER expose private keys in frontend | They're visible to everyone |
| 2 | ALWAYS use testnets first | Mistakes cost real money |
| 3 | VALIDATE all inputs | On-chain and off-chain |
| 4 | USE OpenZeppelin contracts | Battle-tested code |
| 5 | GET audited before mainnet | Fresh eyes find bugs |

---

## Frontend Security

### ❌ NEVER Do This
```typescript
// NEVER store private keys in frontend
const privateKey = "0xabc123...";  // ❌ EXPOSED!

// NEVER trust user data without validation
const amount = parseInt(userInput);  // ❌ Could be NaN/malicious
```

### ✅ Always Do This
```typescript
// Use wallet signatures instead
const signature = await walletClient.signMessage({ message })

// Validate inputs
const amount = BigInt(userInput)
if (amount <= 0n) throw new Error("Invalid amount")
```

---

## Backend Signing Pattern

```python
# backend/services/blockchain_signer.py
from eth_account import Account
from eth_account.messages import encode_defunct

def sign_claim(user_address: str, amount: int, nonce: int) -> str:
    """
    Sign a claim message for the user to submit on-chain.
    The private key stays in the backend - never exposed.
    """
    message = encode_defunct(text=f"{user_address}:{amount}:{nonce}")
    signed = Account.sign_message(message, private_key=SIGNER_KEY)
    return signed.signature.hex()
```

---

## Smart Contract Security Checklist

### Before Testnet
- [ ] All functions have proper access control
- [ ] CEI pattern used for external calls
- [ ] ReentrancyGuard on sensitive functions
- [ ] Input validation on all parameters
- [ ] Events emitted for important state changes

### Before Mainnet
- [ ] Professional security audit completed
- [ ] Fuzz testing with Foundry
- [ ] Formal verification (optional but recommended)
- [ ] Bug bounty program set up
- [ ] Emergency pause mechanism tested

---

## Common Attack Vectors

| Attack | Description | Prevention |
|--------|-------------|------------|
| Reentrancy | Recursive calls drain funds | ReentrancyGuard + CEI |
| Front-running | Bots detect and front-run txs | Commit-reveal / private mempools |
| Flash loan attacks | Instant large borrows | Delayed price updates |
| Signature replay | Reusing valid signatures | Include nonces + deadlines |
| tx.origin phishing | Contracts calling your contract | Use msg.sender only |

---

## Signature Validation

```solidity
// On-chain signature verification
function claimReward(
    uint256 amount,
    uint256 nonce,
    bytes calldata signature
) external {
    // Reconstruct the message
    bytes32 messageHash = keccak256(abi.encodePacked(
        msg.sender,
        amount,
        nonce
    ));
    
    // Verify signer
    address signer = ECDSA.recover(
        MessageHashUtils.toEthSignedMessageHash(messageHash),
        signature
    );
    
    require(signer == trustedSigner, "Invalid signature");
    require(!usedNonces[nonce], "Nonce already used");
    
    usedNonces[nonce] = true;
    // Process claim...
}
```

---

## Environment Variables

```bash
# ✅ Backend .env (NEVER commit)
SIGNER_PRIVATE_KEY=0x...

# ✅ Frontend .env (public, prefix NEXT_PUBLIC_)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ONCHAINKIT_API_KEY=...

# ❌ NEVER put private keys in frontend .env
```
