import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

// 84532 = Base Sepolia (testnet), 8453 = Base (mainnet)
export const config = createConfig({
    chains: [baseSepolia, base],
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
    connectors: [
        injected(),
        coinbaseWallet({
            appName: 'LvlUp',
        }),
    ],
    transports: {
        [baseSepolia.id]: http("https://sepolia.base.org"),
        [base.id]: http(),
    },
})
