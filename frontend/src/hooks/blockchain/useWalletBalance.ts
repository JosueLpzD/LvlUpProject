import { useBalance, useAccount } from 'wagmi';
import { formatEther } from 'viem';

/**
 * Hook para leer el balance de ETH (moneda nativa) del usuario.
 */
export function useWalletBalance() {
    const { address } = useAccount();

    const { data, isError, isLoading, refetch } = useBalance({
        address,
    });

    const formattedBalance = data ? parseFloat(formatEther(data.value)).toFixed(4) : '0.0000';

    return {
        balance: formattedBalance,
        symbol: data?.symbol || 'ETH',
        rawValue: data?.value,
        isLoading,
        isError,
        refetch,
    };
}
