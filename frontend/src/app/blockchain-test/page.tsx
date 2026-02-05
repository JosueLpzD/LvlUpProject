'use client'

/**
 * Componente de prueba para verificar conexión con Base blockchain
 * Este archivo es temporal - solo para testing
 */

import { useEffect, useState } from 'react'

export default function BlockchainTestPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [blockNumber, setBlockNumber] = useState<string>('')
    const [apiKeyStatus, setApiKeyStatus] = useState<string>('')

    useEffect(() => {
        // Test 1: Verificar que la API key está configurada
        const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
        if (apiKey && apiKey.length > 10) {
            setApiKeyStatus(`✅ API Key detectada: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)
        } else {
            setApiKeyStatus('❌ API Key no encontrada en .env.local')
        }

        // Test 2: Conectar a Base Sepolia y obtener bloque actual
        async function testConnection() {
            try {
                // Usamos el RPC público de Base Sepolia
                const response = await fetch('https://sepolia.base.org', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_blockNumber',
                        params: [],
                        id: 1
                    })
                })

                const data = await response.json()

                if (data.result) {
                    // Convertir hex a número
                    const blockNum = parseInt(data.result, 16)
                    setBlockNumber(blockNum.toLocaleString())
                    setStatus('success')
                } else {
                    setStatus('error')
                }
            } catch (error) {
                console.error('Error connecting to Base Sepolia:', error)
                setStatus('error')
            }
        }

        testConnection()
    }, [])

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🔗 Blockchain Connection Test</h1>

                <div className="space-y-6">
                    {/* Test API Key */}
                    <div className="bg-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">1. OnchainKit API Key</h2>
                        <p className="text-lg">{apiKeyStatus}</p>
                    </div>

                    {/* Test RPC Connection */}
                    <div className="bg-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">2. Base Sepolia RPC</h2>
                        {status === 'loading' && (
                            <p className="text-yellow-400">⏳ Conectando a Base Sepolia...</p>
                        )}
                        {status === 'success' && (
                            <div>
                                <p className="text-green-400 text-lg">✅ Conexión exitosa!</p>
                                <p className="text-zinc-400 mt-2">
                                    Bloque actual: <span className="text-white font-mono">{blockNumber}</span>
                                </p>
                            </div>
                        )}
                        {status === 'error' && (
                            <p className="text-red-400">❌ Error conectando a Base Sepolia</p>
                        )}
                    </div>

                    {/* Resumen */}
                    <div className="bg-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">3. Chain Info</h2>
                        <ul className="space-y-2 text-zinc-300">
                            <li>• Red: <span className="text-white">Base Sepolia (Testnet)</span></li>
                            <li>• Chain ID: <span className="text-white font-mono">84532</span></li>
                            <li>• RPC: <span className="text-white font-mono">https://sepolia.base.org</span></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 text-center text-zinc-500">
                    <p>Este es un test temporal. Eliminar después de verificar.</p>
                </div>
            </div>
        </div>
    )
}
