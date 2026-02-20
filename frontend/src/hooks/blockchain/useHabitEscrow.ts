import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { HABIT_ESCROW_ADDRESS, HabitEscrowABI } from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';

const WITHDRAW_ABI = [
    {
        type: "function",
        name: "withdraw",
        inputs: [
            { name: "weekId", type: "uint256" },
            { name: "amountToReturn", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "signature", type: "bytes" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;
import { useState } from 'react';

/**
 * Hook para interactuar con HabitEscrow (Commitment Contracts).
 */
/**
 * Hook para interactuar con HabitEscrow (Commitment Contracts).
 */
export function useHabitEscrow(weekId: number = 1) {
    const { address } = useAccount();
    const { writeContractAsync, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const [isSigning, setIsSigning] = useState(false);
    const [actionType, setActionType] = useState<'IDLE' | 'DEPOSIT' | 'SETTLE'>('IDLE');
    const [settlementAmount, setSettlementAmount] = useState<string>('0');

    // Using the dynamic weekId passed as argument
    const currentWeekId = weekId;

    const { data: depositAmount, refetch: refetchDeposit, isLoading: isReading, error: readError } = useReadContract({
        address: HABIT_ESCROW_ADDRESS,
        abi: HabitEscrowABI,
        functionName: 'deposits',
        args: [address!, BigInt(currentWeekId)],
        query: {
            enabled: !!address,
        }
    });

    /**
     * Deposita ETH en el contrato.
     */
    const depositETH = async (amount: string) => {
        try {
            setActionType('DEPOSIT');
            await writeContractAsync({
                address: HABIT_ESCROW_ADDRESS,
                abi: HabitEscrowABI,
                functionName: 'deposit',
                args: [BigInt(currentWeekId)],
                value: parseEther(amount)
            });
        } catch (e) {
            console.error("Deposit Error:", e);
            setActionType('IDLE');
        }
    };

    /**
     * Solicita firma al backend y ejecuta el retiro.
     */
    const settleAndWithdraw = async (isDebug = false) => {
        if (!address) return;
        setIsSigning(true);
        try {
            // 1. Pedir firma al backend (Endpoint depende de si es Debug o Real)
            const endpoint = isDebug
                ? 'http://localhost:8000/finance/debug/settle'
                : 'http://localhost:8000/finance/settlement/sign';

            console.log(`📡 Fetching signature from: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_address: address,
                    week_id: currentWeekId,
                    deposit_amount: depositAmount ? depositAmount.toString() : "0"
                })
            });

            console.log(`📡 Response status: ${response.status}`);
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error backend (${response.status}): ${errText}`);
            }

            const data = await response.json();
            console.log("📦 Settlement Data:", data);

            // 2. Ejecutar transacción On-Chain
            // Aseguramos que los valores existan antes de convertir a BigInt
            if (!data.signature || data.amount_to_return === undefined || !data.deadline) {
                throw new Error("Respuesta inválida del servidor (faltan campos)");
            }

            setActionType('SETTLE');
            setSettlementAmount(data.amount_to_return.toString());

            console.log("📝 Requesting wallet signature locally...");
            await writeContractAsync({
                address: HABIT_ESCROW_ADDRESS,
                abi: WITHDRAW_ABI,
                functionName: 'withdraw',
                args: [
                    BigInt(data.week_id || currentWeekId),
                    BigInt(data.amount_to_return),
                    BigInt(data.deadline),
                    (data.signature.startsWith('0x') ? data.signature : `0x${data.signature}`) as `0x${string}`
                ]
            });
            console.log("✅ Transaction submitted!");

        } catch (error) {
            console.error(error);
            alert("Error al procesar liquidación: " + error);
            setActionType('IDLE');
        } finally {
            setIsSigning(false);
        }
    };

    return {
        depositAmount: depositAmount ? formatEther(depositAmount) : '0',
        depositETH,
        settleAndWithdraw,
        isLoading: isWritePending || isConfirming || isSigning || isReading,
        isSuccess: isConfirmed,
        hash,
        refetch: refetchDeposit,
        readError,
        actionType,
        settlementAmount
    };
}
