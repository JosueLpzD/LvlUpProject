import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { HABIT_STAKING_ADDRESS, HabitStakingABI, LVLUP_TOKEN_ADDRESS, LvlUpTokenABI } from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';

export interface StakeInfo {
    amount: string;
    startTime: number;
    endTime: number;
    habitsCompleted: number;
    habitsRequired: number;
    active: boolean;
    claimed: boolean;
}

/**
 * Hook para interactuar con el contrato HabitStaking.
 * Permite leer el estado del stake y ejecutar acciones (approve, stake, claim).
 */
export function useStaking() {
    const { address } = useAccount();
    const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract();

    // 1. Leer información del Stake actual
    const { data: stakeData, refetch: refetchStake, isLoading: isLoadingStake } = useReadContract({
        address: HABIT_STAKING_ADDRESS,
        abi: HabitStakingABI,
        functionName: 'getStakeInfo',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // 2. Leer Allowance (permiso para gastar tokens)
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: LVLUP_TOKEN_ADDRESS,
        abi: LvlUpTokenABI,
        functionName: 'allowance',
        args: address ? [address, HABIT_STAKING_ADDRESS] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // 3. Esperar confirmación de transacción
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Formatear datos del stake para la UI
    const stakeInfo: StakeInfo | null = stakeData ? {
        amount: formatEther(stakeData.amount),
        startTime: Number(stakeData.startTime),
        endTime: Number(stakeData.endTime),
        habitsCompleted: Number(stakeData.habitsCompleted),
        habitsRequired: Number(stakeData.habitsRequired),
        active: stakeData.active,
        claimed: stakeData.claimed,
    } : null;

    // Acciones

    // A. Aprobar tokens (Paso 1 antes de stakear)
    const approveTokens = (amount: string) => {
        writeContract({
            address: LVLUP_TOKEN_ADDRESS,
            abi: LvlUpTokenABI,
            functionName: 'approve',
            args: [HABIT_STAKING_ADDRESS, parseEther(amount)],
        });
    };

    // B. Stakear (Paso 2)
    const stake = (amount: string, habits: number) => {
        writeContract({
            address: HABIT_STAKING_ADDRESS,
            abi: HabitStakingABI,
            functionName: 'stake',
            args: [parseEther(amount), BigInt(habits)],
        });
    };

    // C. Reclamar (Al finalizar)
    const claim = () => {
        writeContract({
            address: HABIT_STAKING_ADDRESS,
            abi: HabitStakingABI,
            functionName: 'claimRewards',
        });
    };

    return {
        stakeInfo,
        allowance: allowance ? formatEther(allowance) : '0',
        isLoading: isLoadingStake,
        isWritePending,
        isConfirming,
        isConfirmed,
        hash,
        writeError,
        approveTokens,
        stake,
        claim,
        refetch: () => { refetchStake(); refetchAllowance(); }
    };
}
