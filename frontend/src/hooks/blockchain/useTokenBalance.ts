import { useReadContract, useAccount } from 'wagmi';
import { LVLUP_TOKEN_ADDRESS, LvlUpTokenABI } from '@/lib/contracts';
import { formatEther } from 'viem';

/**
 * Hook para leer el balance de tokens $LVLUP del usuario conectado.
 */
export function useTokenBalance() {
    const { address } = useAccount();

    // Leer balance del contrato ERC-20
    const { data: balanceWei, isError, isLoading, refetch } = useReadContract({
        address: LVLUP_TOKEN_ADDRESS,
        abi: LvlUpTokenABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address, // Solo ejecutar si hay wallet conectada
        }
    });

    // Formatear de Wei (1e18) a Ether legible
    const balance = balanceWei ? formatEther(balanceWei) : '0';

    return {
        balance,
        balanceWei,
        isLoading,
        isError,
        refetch,
    };
}
