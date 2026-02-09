'use client'

/**
 * WalletInfo - Muestra información del wallet conectado
 * 
 * Incluye:
 * - Balance de ETH
 * - Chain actual
 * - Dirección del usuario
 */

import { useAccount, useBalance, useChainId } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'

export function WalletInfo() {
    // Hook para obtener cuenta conectada
    const { address, isConnected } = useAccount()

    // Hook para obtener chain ID actual
    const chainId = useChainId()

    // Hook para obtener balance (solo si hay dirección)
    const { data: balance, isLoading: balanceLoading } = useBalance({
        address: address,
    })

    // Si no está conectado, no mostrar nada
    if (!isConnected || !address) {
        return null
    }

    // Determinar nombre de la red
    const chainName = chainId === base.id
        ? 'Base Mainnet'
        : chainId === baseSepolia.id
            ? 'Base Sepolia'
            : `Chain ${chainId}`

    return (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">Wallet Info</h3>

            {/* Dirección */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Address</span>
                <span className="text-xs font-mono text-zinc-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Balance</span>
                <span className="text-sm font-medium text-white">
                    {balanceLoading
                        ? '...'
                        : `${Number(balance?.formatted || 0).toFixed(4)} ${balance?.symbol || 'ETH'}`
                    }
                </span>
            </div>

            {/* Red */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Network</span>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {chainName}
                </span>
            </div>
        </div>
    )
}
