---
name: onchainkit-integration
description: Coinbase OnchainKit component patterns and Base network integration. Use when implementing wallet UI or OnchainKit components.
---

# OnchainKit Integration Skill

## Trigger
Use this skill when:
- Setting up wallet connection
- Using OnchainKit components
- Integrating with Base network
- Building transaction UIs

---

## Provider Setup

```typescript
// providers/Web3Provider.tsx
'use client'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'

const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

## Core Components

### Wallet Connection
```tsx
import { 
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet'

function WalletButton() {
  return (
    <Wallet>
      <ConnectWallet>
        <span>Connect Wallet</span>
      </ConnectWallet>
      <WalletDropdown>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  )
}
```

### User Identity
```tsx
import { 
  Identity,
  Avatar,
  Name,
  Badge,
  Address 
} from '@coinbase/onchainkit/identity'

function UserProfile({ address }: { address: `0x${string}` }) {
  return (
    <Identity address={address}>
      <Avatar />
      <Name>
        <Badge />
      </Name>
      <Address />
    </Identity>
  )
}
```

### Transaction Button
```tsx
import { 
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction
} from '@coinbase/onchainkit/transaction'

function ClaimButton({ contracts }) {
  return (
    <Transaction
      chainId={baseSepolia.id}
      contracts={contracts}
      onSuccess={(response) => console.log('Success!', response)}
    >
      <TransactionButton text="Claim Reward" />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
    </Transaction>
  )
}
```

---

## Chain Configuration

| Network | Chain ID | Use |
|---------|----------|-----|
| Base Sepolia | 84532 | Testing |
| Base | 8453 | Production |

```typescript
// Select chain based on environment
const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' 
  ? base 
  : baseSepolia
```

---

## Styling

```tsx
// OnchainKit provides CSS classes you can customize
import '@coinbase/onchainkit/styles.css'

// Or use className prop for Tailwind
<ConnectWallet className="bg-blue-500 hover:bg-blue-600 rounded-lg" />
```

---

## Error Handling

```tsx
<Transaction
  contracts={contracts}
  onError={(error) => {
    if (error.message.includes('rejected')) {
      toast.error('Transaction rejected')
    } else {
      toast.error('Transaction failed')
    }
  }}
  onSuccess={() => {
    toast.success('Transaction confirmed!')
  }}
>
  <TransactionButton />
</Transaction>
```
