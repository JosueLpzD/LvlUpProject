'use client';

import { useState, useEffect } from 'react';
import { useHabitEscrow, useWalletBalance } from '@/hooks/blockchain';
import { useAccount } from 'wagmi';
import { Loader2, ShieldCheck, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommitmentCard() {
    const { isConnected } = useAccount();
    const { depositETH, settleAndWithdraw, depositAmount, isLoading, isSuccess, hash } = useHabitEscrow();
    const [amount, setAmount] = useState('');

    // Estado simulado para la demo: ¿Es fin de semana (hora de liquidar)?
    // En producción esto vendría del backend
    const [isSettlementTime, setIsSettlementTime] = useState(false);

    const hasActiveDeposit = parseFloat(depositAmount) > 0;

    const handleAction = () => {
        if (hasActiveDeposit) {
            // Si ya hay depósito, asumimos que es hora de liquidar o aumentar
            // Por simplicidad de la UI, si hay depósito mostramos opción de liquidar si simulamos fin de semana
            if (isSettlementTime) {
                settleAndWithdraw();
            } else {
                alert("Aún no termina la semana. ¡Sigue cumpliendo hábitos!");
            }
        } else {
            if (!amount) return;
            depositETH(amount);
        }
    };

    return (
        <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 shadow-2xl">
            {/* Background Effects */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />

            <div className="relative z-10 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                            <ShieldCheck className="h-6 w-6 text-blue-500" />
                            Compromiso Semanal
                        </h3>
                        <p className="text-sm text-zinc-400">
                            Apuesta ETH a tus hábitos. Cumple o paga la multa.
                        </p>
                    </div>
                    {hasActiveDeposit && (
                        <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                            ACTIVO
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black/40 p-6">
                    {hasActiveDeposit ? (
                        <div className="text-center">
                            <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">Tu Apuesta</p>
                            <div className="my-2 flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-bold text-white">{parseFloat(depositAmount).toFixed(4)}</span>
                                <span className="text-lg font-bold text-blue-500">ETH</span>
                            </div>

                            {!isSettlementTime ? (
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-yellow-500">
                                    <AlertTriangle size={14} />
                                    <span>Bloqueado hasta el Domingo</span>
                                </div>
                            ) : (
                                <div className="mt-4 text-xs text-green-400">
                                    ¡Semana finalizada! Puedes liquidar.
                                </div>
                            )}

                            {/* Toggle de Debug para simular paso del tiempo */}
                            <button
                                onClick={() => setIsSettlementTime(!isSettlementTime)}
                                className="mt-6 text-[10px] text-zinc-700 hover:text-zinc-500"
                            >
                                [DEBUG: Simular {isSettlementTime ? 'Inicio Semana' : 'Fin Semana'}]
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Monto a Apostar (ETH)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.01"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-lg font-bold text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                                />
                                <div className="absolute right-4 top-4 text-xs font-bold text-zinc-500">ETH</div>
                            </div>
                            <p className="mt-2 text-[10px] text-zinc-500">
                                * Si fallas tus hábitos, perderás el 10% de este monto.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    disabled={!isConnected || isLoading || (!hasActiveDeposit && !amount)}
                    className={`group relative flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all
                        ${hasActiveDeposit && isSettlementTime
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'}
                        disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : hasActiveDeposit ? (
                        isSettlementTime ? "Liquidar y Reclamar" : "En Progreso..."
                    ) : (
                        <>
                            <TrendingUp className="h-5 w-5" />
                            Comprometerme
                        </>
                    )}
                </button>

                {hash && (
                    <div className="text-center">
                        <a
                            href={`https://sepolia.basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-zinc-500 underline hover:text-blue-400"
                        >
                            Ver transacción: {hash.slice(0, 6)}...{hash.slice(-4)}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
