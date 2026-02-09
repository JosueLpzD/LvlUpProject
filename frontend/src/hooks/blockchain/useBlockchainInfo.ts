'use client'

/**
 * Hook para obtener información del blockchain
 * Combina estado de wagmi con datos adicionales
 */

import { useAccount, useBalance, useChainId } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { useMemo } from 'react'

interface BlockchainInfo {
    // Cuenta
    address: `0x${string}` | undefined
    isConnected: boolean

    // Balance
    balance: string
    balanceSymbol: string
    isBalanceLoading: boolean

    // Chain
    chainId: number
    chainName: string
    isTestnet: boolean
    explorerUrl: string
}

export function useBlockchainInfo(): BlockchainInfo {
    const { address, isConnected } = useAccount()
    const chainId = useChainId()

    const { data: balance, isLoading: isBalanceLoading } = useBalance({
        address: address,
    })

    // Información de la chain
    const chainInfo = useMemo(() => {
        const isBase = chainId === base.id
        const isBaseSepolia = chainId === baseSepolia.id

        return {
            chainName: isBase
                ? 'Base Mainnet'
                : isBaseSepolia
                    ? 'Base Sepolia'
                    : `Unknown (${chainId})`,
            isTestnet: isBaseSepolia,
            explorerUrl: isBase
                ? 'https://basescan.org'
                : 'https://sepolia.basescan.org',
        }
    }, [chainId])

    return {
        // Cuenta
        address,
        isConnected,

        // Balance
        balance: balance?.formatted ?? '0',
        balanceSymbol: balance?.symbol ?? 'ETH',
        isBalanceLoading,

        // Chain
        chainId,
        ...chainInfo,
    }
}
