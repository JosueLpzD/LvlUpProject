import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { HABIT_ESCROW_ADDRESS, HabitEscrowABI } from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';

/**
 * Hook para interactuar con HabitEscrow (Commitment Contracts).
 */
export function useHabitEscrow() {
    const { address } = useAccount();
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const [isSigning, setIsSigning] = useState(false);

    // Leer depósito activo para la semana actual (Mock weekId=1 por ahora)
    // TODO: Calcular weekId dinámicamente
    const currentWeekId = 1;

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
    const depositETH = (amount: string) => {
        writeContract({
            address: HABIT_ESCROW_ADDRESS,
            abi: HabitEscrowABI,
            functionName: 'deposit',
            args: [BigInt(currentWeekId)],
            value: parseEther(amount)
        });
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

            writeContract({
                address: HABIT_ESCROW_ADDRESS,
                abi: HabitEscrowABI,
                functionName: 'withdraw',
                args: [
                    BigInt(data.week_id || currentWeekId), // week_id a veces viene como week_id o weekId
                    BigInt(data.amount_to_return),
                    BigInt(data.deadline),
                    data.signature as `0x${string}`
                ]
            });

        } catch (error) {
            console.error(error);
            alert("Error al procesar liquidación: " + error);
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
        readError
    };
}
