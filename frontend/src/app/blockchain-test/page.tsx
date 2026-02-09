'use client'

/**
 * Página de prueba de integración blockchain
 * Demuestra el uso de Web3Provider, componentes y hooks
 */

import { useEffect, useState } from 'react'
import { Web3Provider } from '@/providers/Web3Provider'
import { ConnectWallet, WalletInfo } from '@/components/web3'
import { useBlockchainInfo } from '@/hooks/blockchain'
import { getBlockNumber } from '@/infrastructure/adapters'

// Componente interno que usa hooks de blockchain
function BlockchainDemo() {
    const { isConnected, chainName, explorerUrl } = useBlockchainInfo()
    const [blockNumber, setBlockNumber] = useState<string>('')
    const [apiKeyStatus, setApiKeyStatus] = useState<string>('')

    useEffect(() => {
        // Verificar API key
        const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
        if (apiKey && apiKey.length > 10) {
            setApiKeyStatus(`✅ API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)
        } else {
            setApiKeyStatus('❌ API Key no encontrada')
        }

        // Obtener bloque actual
        async function fetchBlock() {
            try {
                const block = await getBlockNumber()
                setBlockNumber(block.toLocaleString())
            } catch (error) {
                console.error('Error fetching block:', error)
            }
        }
        fetchBlock()
    }, [])

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">🔗 Blockchain Integration</h1>
                    <p className="text-zinc-400">LvlUp × Base Network</p>
                </div>

                {/* Connect Wallet */}
                <div className="bg-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">1. Connect Wallet</h2>
                    <ConnectWallet />
                </div>

                {/* Wallet Info (solo si conectado) */}
                {isConnected && (
                    <div className="bg-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">2. Wallet Info</h2>
                        <WalletInfo />
                    </div>
                )}

                {/* Chain Info */}
                <div className="bg-zinc-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {isConnected ? '3.' : '2.'} Chain Info
                    </h2>
                    <ul className="space-y-2 text-zinc-300">
                        <li className="flex justify-between">
                            <span className="text-zinc-500">API Key</span>
                            <span>{apiKeyStatus}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-zinc-500">Network</span>
                            <span className="text-emerald-400">{chainName}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-zinc-500">Block</span>
                            <span className="font-mono">{blockNumber || '...'}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-zinc-500">Explorer</span>
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                            >
                                {explorerUrl.replace('https://', '')}
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-600 text-sm">
                    Fase 2: Integración Frontend ✅
                </p>
            </div>
        </div>
    )
}

// Página principal envuelta en Web3Provider
export default function BlockchainTestPage() {
    return (
        <Web3Provider>
            <BlockchainDemo />
        </Web3Provider>
    )
}
