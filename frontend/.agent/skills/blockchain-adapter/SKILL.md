---
name: blockchain-adapter
description: Best practices for Web3, Wallet connections, and Blockchain interactions. Use when working with ethers.js, viem, wagmi, or wallet connectivity.
---

# Blockchain Adapter Skill

## Trigger
Use this skill when:
- Connecting wallets
- Reading/writing blockchain data
- Working with wagmi hooks
- Using viem for transactions
- Implementing OnchainKit components

---

## Architecture Rules

### 1. Component Separation
```
'use client'  ← ALWAYS for wallet components

components/web3/       ← UI components only
infrastructure/adapters/ ← Core blockchain logic
hooks/blockchain/      ← Custom hooks
```

### 2. Never Leak Provider Logic
```typescript
// ❌ WRONG - viem in component
import { createPublicClient } from 'viem'
function MyComponent() {
  const client = createPublicClient({...})
}

// ✅ CORRECT - viem in adapter
// infrastructure/adapters/blockchain.ts
export const publicClient = createPublicClient({...})

// components/MyComponent.tsx
import { publicClient } from '@/infrastructure/adapters/blockchain'
```

---

## Wagmi Patterns

### Hook Usage
```typescript
// ✅ Use wagmi hooks for state
import { useAccount, useBalance, useChainId } from 'wagmi'

function WalletInfo() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const chainId = useChainId()
}
```

### Write Transactions
```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

function ClaimReward() {
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  
  const handleClaim = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'claim',
      args: [amount]
    })
  }
}
```

---

## Viem Patterns

### Public Client (Read-only)
```typescript
// infrastructure/adapters/blockchain.ts
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})
```

### Read Contract
```typescript
const balance = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
})
```

---

## Error Handling

```typescript
import { BaseError, ContractFunctionRevertedError } from 'viem'

try {
  await writeContract(...)
} catch (err) {
  if (err instanceof BaseError) {
    const revertError = err.walk(e => e instanceof ContractFunctionRevertedError)
    if (revertError) {
      const errorName = revertError.data?.errorName ?? 'Unknown'
      // Handle specific contract errors
    }
  }
}
```

---

## Security Rules

| Rule | Description |
|------|-------------|
| Never expose private keys | Use wallet signatures only |
| Validate chain ID | Ensure correct network before transactions |
| Use testnets first | Always test on Base Sepolia |
| Handle rejections | Users can reject transactions |

---

## File Structure

```
frontend/src/
├── components/
│   └── web3/
│       ├── ConnectWallet.tsx
│       ├── WalletBalance.tsx
│       └── TransactionButton.tsx
├── infrastructure/
│   └── adapters/
│       ├── blockchain.ts      # viem clients
│       ├── tokenAdapter.ts    # ERC-20 logic
│       └── nftAdapter.ts      # ERC-721 logic
├── hooks/
│   └── blockchain/
│       ├── useTokenBalance.ts
│       └── useRewardsClaim.ts
└── providers/
    └── Web3Provider.tsx
```
