'use client'

/**
 * Web3Provider - Provider principal para integración blockchain
 * 
 * Configura:
 * - WagmiProvider: Gestión de estado de wallet
 * - QueryClientProvider: Cache de react-query
 * - OnchainKitProvider: Componentes de Coinbase para Base
 */

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type State } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { type ReactNode, useState } from 'react'
import { config } from '@/lib/wagmi'

// Importar estilos de OnchainKit
import '@coinbase/onchainkit/styles.css'

// Seleccionar chain basado en variable de entorno
// 84532 = Base Sepolia (testnet), 8453 = Base (mainnet)
const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453'
    ? base
    : baseSepolia

interface Web3ProviderProps {
    children: ReactNode
    initialState?: State
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
    // QueryClient para react-query (cache de datos blockchain)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Datos blockchain no cambian tan rápido
                staleTime: 1000 * 60, // 1 minuto
                // Reintentar en caso de error
                retry: 2,
            },
        },
    }))

    return (
        <WagmiProvider config={config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider
                    // apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                    chain={activeChain}
                >
                    {children}
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
