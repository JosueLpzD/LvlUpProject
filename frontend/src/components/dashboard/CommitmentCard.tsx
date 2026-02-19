'use client';

import { useState, useEffect } from 'react';
import { useHabitEscrow, useWalletBalance } from '@/hooks/blockchain';
import { useEthPrice } from '@/hooks/useEthPrice';
import { useAccount, useSwitchChain } from 'wagmi';
import { Loader2, ShieldCheck, TrendingUp, AlertTriangle, ExternalLink, Network, Settings2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommitmentConfigModal } from './CommitmentConfigModal';
import { RiskAreaChart } from './RiskAreaChart';
import { timeblockService } from '@/services/timeblockService';

export function CommitmentCard() {
    const { isConnected, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const { depositETH, settleAndWithdraw, depositAmount, isLoading, isSuccess, hash, refetch, readError } = useHabitEscrow();

    // Auto-update UI after successful transaction (No Time Limit Mode)
    useEffect(() => {
        if (isSuccess && refetch) {
            refetch();
            // Optional: User feedback handled by toast or let diagram update
        }
    }, [isSuccess, refetch]);
    const { price: ethPrice } = useEthPrice();
    const [amount, setAmount] = useState('');

    const REQUIRED_CHAIN_ID = 84532; // Base Sepolia
    const isWrongNetwork = isConnected && chainId !== REQUIRED_CHAIN_ID;
    const [isSettlementTime, setIsSettlementTime] = useState(false);

    // --- Dust & Active Logic ---
    const DUST_THRESHOLD = 0.001; // 0.001 ETH threshold
    const depositNum = parseFloat(depositAmount);
    // Contract is effectively active only if deposit >= threshold
    const hasActiveDeposit = depositNum >= DUST_THRESHOLD;
    // Dust detected if > 0 but < threshold
    const isDust = depositNum > 0 && depositNum < DUST_THRESHOLD;

    // --- New State for Config Modes ---
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [habits, setHabits] = useState<any[]>([]); // We need to fetch habits
    const [stats, setStats] = useState({ completed: 0, total: 0 }); // For Risk Chart
    const [mode, setMode] = useState<'HARD' | 'CUSTOM'>('HARD');

    // Load Habits for the Modal
    useEffect(() => {
        const fetchHabits = async () => {
            // En un app real, esto vendría de un servicio de hábitos global.
            // Por simplicidad, leeremos los timeblocks de HOY para extraer los hábitos únicos.
            const today = new Date().toISOString().split('T')[0];
            const blocks = await timeblockService.getByDate(today);

            // Extraer hábitos únicos de los bloques
            const uniqueHabits = Array.from(new Set(blocks.map(b => b.habit_id)))
                .map(id => {
                    const block = blocks.find(b => b.habit_id === id);
                    return { id, title: block?.title || 'Hábito', emoji: '🎯' }; // Emoji y título vendrían del block
                });
            setHabits(uniqueHabits);

            // Calcular stats simples para la demo
            const completed = blocks.filter(b => b.completed).length;
            setStats({ completed, total: blocks.length });
        };
        fetchHabits();
    }, []);

    const handleOpenConfig = () => {
        if (!amount) return;
        setIsConfigModalOpen(true);
    };

    const handleConfirmConfig = async (selectedMode: 'HARD' | 'CUSTOM', selectedIds: string[]) => {
        setIsConfigModalOpen(false);
        setMode(selectedMode);

        // 1. Guardar Config en Backend
        try {
            await fetch('http://localhost:8000/finance/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_address: isConnected ? "0x123...mock" : "", // TODO: Get real address
                    week_id: 1, // Start week
                    mode: selectedMode,
                    selected_habit_ids: selectedIds
                })
            });

            // 2. Proceder al depósito en Blockchain
            depositETH(amount);

        } catch (error) {
            console.error("Error saving config:", error);
            alert("Error guardando configuración de compromiso.");
        }
    };

    const handleAction = () => {
        if (hasActiveDeposit) {
            if (isSettlementTime) {
                settleAndWithdraw();
            } else {
                alert("Aún no termina la semana. ¡Sigue cumpliendo hábitos!");
            }
        } else {
            // First open config modal
            handleOpenConfig();
        }
    };

    return (
        <>
            <CommitmentConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                onConfirm={handleConfirmConfig}
                habits={habits}
            />

            <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 shadow-2xl">
                {/* Background Effects */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />

                {/* Mode Selection / Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    {hasActiveDeposit ? (
                        // LOCKED MODE (Active Contract)
                        <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 backdrop-blur-sm shadow-lg",
                            mode === 'HARD' ? "bg-red-500/20 border-red-500/30 text-red-300 shadow-red-900/20" : "bg-blue-500/20 border-blue-500/30 text-blue-300 shadow-blue-900/20"
                        )}>
                            {mode === 'HARD' ? <Flame size={12} className="animate-pulse" /> : <Settings2 size={12} />}
                            {mode} MODE ACTIVO
                        </div>
                    ) : (
                        // INTERACTIVE TOGGLE (No Active Contract)
                        <div className="flex items-center bg-black/40 rounded-full p-1 border border-zinc-700/50 backdrop-blur-sm">
                            <button
                                onClick={() => setMode('HARD')}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all",
                                    mode === 'HARD'
                                        ? "bg-red-500 text-white shadow-lg shadow-red-900/20 scale-105"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Flame size={10} />
                                HARD
                            </button>
                            <button
                                onClick={() => setMode('CUSTOM')}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all",
                                    mode === 'CUSTOM'
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-900/20 scale-105"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Settings2 size={10} />
                                CUSTOM
                            </button>
                        </div>
                    )}
                </div>


                <div className="relative z-10 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-start justify-between pr-24"> {/* Padding for badges */}
                        <div>
                            <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                                <ShieldCheck className="h-6 w-6 text-blue-500" />
                                Compromiso Semanal
                            </h3>
                            <p className="text-sm text-zinc-400">
                                Apuesta ETH a tus hábitos. Cumple o paga la multa.
                            </p>
                        </div>
                    </div>

                    {/* Network Warning */}
                    {isWrongNetwork && (
                        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-red-500/20 p-2 text-red-400">
                                    <Network size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Red Incorrecta</h4>
                                    <p className="text-xs text-red-300">Cambia a Base Sepolia para continuar.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => switchChain({ chainId: REQUIRED_CHAIN_ID })}
                                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/30"
                            >
                                Cambiar Red
                            </button>
                        </div>
                    )}

                    {/* Read Error Warning (API/RPC Issues) */}
                    {readError && (
                        <div className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-yellow-500/20 p-2 text-yellow-400">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-400">Error de Conexión</h4>
                                    <p className="text-xs text-yellow-300">No pudimos verificar tu contrato. Revisa tu conexión o API Key.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black/40 p-6">
                        {hasActiveDeposit && (
                            <div className="mb-6 space-y-6">
                                {/* 1. Risk Visualization Chart */}
                                <RiskAreaChart
                                    depositAmount={parseFloat(depositAmount)}
                                    ethPrice={ethPrice}
                                    completed={stats.completed}
                                    total={stats.total}
                                    isHardMode={mode === 'HARD'}
                                />

                                {/* 2. Text Summary */}
                                <div className="text-center">
                                    <div className="text-xs font-medium text-zinc-400">
                                        Tu depósito actual: {(parseFloat(depositAmount)).toFixed(parseFloat(depositAmount) < 0.001 ? 6 : 4)} ETH (${(parseFloat(depositAmount) * ethPrice).toFixed(2)})
                                    </div>

                                    {!isSettlementTime ? (
                                        <div className="mt-4 flex flex-col items-center justify-center gap-1">
                                            <div className="flex items-center gap-2 text-xs text-yellow-500">
                                                <AlertTriangle size={14} />
                                                <span>Bloqueado hasta el Domingo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 text-xs text-green-400">
                                            ¡Semana finalizada! Puedes liquidar.
                                        </div>
                                    )}

                                    {/* Debug Controls */}
                                    <div className="mt-6 flex flex-col gap-2 border-t border-zinc-800 pt-4">
                                        <div className="text-[10px] font-bold uppercase text-zinc-600">🛠️ Zona de Pruebas</div>

                                        <button
                                            onClick={() => setIsSettlementTime(!isSettlementTime)}
                                            className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {isSettlementTime ? '⏹️ Detener Simulación' : '▶️ Simular Fin de Semana (UI)'}
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (!confirm("⚠️ ¿Forzar liquidación ahora?")) return;
                                                console.log("🧪 Debug: Iniciando liquidación forzada...");
                                                try {
                                                    await settleAndWithdraw(true);
                                                    console.log("🧪 Debug: Liquidación solicitada con éxito.");
                                                } catch (e) {
                                                    console.error("🧪 Debug Error:", e);
                                                    alert("Error en liquidación: " + e);
                                                }
                                            }}
                                            disabled={isLoading}
                                            className="text-[10px] text-red-900 hover:text-red-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 size={10} className="animate-spin" /> : '⚡ Liquidación Inmediata (DEV - No Time Rules)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Up / Initial Deposit Input */}
                        {!isSettlementTime && (
                            <div className="w-full border-t border-zinc-800 pt-4">
                                <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">
                                    {hasActiveDeposit ? "Añadir más fondos (Top Up)" : "Monto a Apostar (ETH)"}
                                </label>
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
                                <div className="mt-1 text-right text-xs font-medium text-zinc-500">
                                    ≈ ${amount ? (parseFloat(amount) * ethPrice).toFixed(2) : '0.00'} USD
                                </div>
                                {!hasActiveDeposit && (
                                    <p className="mt-2 text-[10px] text-zinc-500">
                                        * Si fallas tus hábitos, perderás el 10% de este monto.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2">
                        {isDust && !hasActiveDeposit && (
                            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs">
                                <span className="text-zinc-500">
                                    Residuo detectado: <span className="text-zinc-300 font-mono">{depositNum.toFixed(6)} ETH</span>
                                </span>
                                <button
                                    onClick={() => settleAndWithdraw(true)}
                                    disabled={isLoading}
                                    className="text-red-400 hover:text-red-300 underline disabled:opacity-50"
                                >
                                    {isLoading ? 'Procesando...' : 'Retirar Todo'}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (hasActiveDeposit) {
                                    if (isSettlementTime) {
                                        settleAndWithdraw();
                                    } else if (amount) {
                                        // Top Up Logic
                                        depositETH(amount);
                                        setAmount('');
                                    } else {
                                        alert("Ingresa un monto para añadir fondos.");
                                    }
                                } else {
                                    handleAction();
                                }
                            }}
                            disabled={!isConnected || isWrongNetwork || isLoading || (!hasActiveDeposit && !amount && !isSettlementTime) || !!readError}
                            className={`group relative flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all
                                ${hasActiveDeposit && isSettlementTime
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'}
                                disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : hasActiveDeposit ? (
                                isSettlementTime
                                    ? "Liquidar y Reclamar"
                                    : (amount ? `Confirmar Top-Up (+${amount} ETH)` : "Contrato Activo - Cumpliendo...")
                            ) : (
                                <>
                                    <TrendingUp className="h-5 w-5" />
                                    Comprometerme
                                </>
                            )}
                        </button>
                    </div>

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
        </>
    );
}

// Helper utility for classnames if not imported
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
