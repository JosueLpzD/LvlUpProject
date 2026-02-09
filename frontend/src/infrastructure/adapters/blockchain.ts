/**
 * Blockchain Adapter
 * 
 * Capa de abstracción para interacciones con blockchain.
 * Toda la lógica de viem debe estar aquí, NO en componentes.
 */

import { createPublicClient, http, formatEther, parseEther } from 'viem'
import { baseSepolia, base } from 'viem/chains'

// Seleccionar chain basado en variable de entorno
const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453'
    ? base
    : baseSepolia

/**
 * Cliente público (read-only) para leer datos de blockchain
 * No requiere wallet conectado
 */
export const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
})

/**
 * Obtiene el balance de una dirección
 * @param address - Dirección del usuario
 * @returns Balance formateado en ETH
 */
export async function getBalance(address: `0x${string}`): Promise<string> {
    const balance = await publicClient.getBalance({ address })
    return formatEther(balance)
}

/**
 * Obtiene el número de bloque actual
 * @returns Número de bloque
 */
export async function getBlockNumber(): Promise<bigint> {
    return await publicClient.getBlockNumber()
}

/**
 * Lee datos de un contrato sin necesidad de transacción
 * @param contractAddress - Dirección del contrato
 * @param abi - ABI del contrato
 * @param functionName - Nombre de la función a llamar
 * @param args - Argumentos de la función
 */
export async function readContract<T>({
    contractAddress,
    abi,
    functionName,
    args = [],
}: {
    contractAddress: `0x${string}`
    abi: readonly unknown[]
    functionName: string
    args?: unknown[]
}): Promise<T> {
    return await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName,
        args,
    }) as T
}

/**
 * Convierte ETH a Wei
 * @param eth - Cantidad en ETH como string
 * @returns Cantidad en Wei como bigint
 */
export function ethToWei(eth: string): bigint {
    return parseEther(eth)
}

/**
 * Convierte Wei a ETH
 * @param wei - Cantidad en Wei como bigint
 * @returns Cantidad en ETH como string
 */
export function weiToEth(wei: bigint): string {
    return formatEther(wei)
}

/**
 * Exportar la chain activa para uso en otros módulos
 */
export { activeChain }
