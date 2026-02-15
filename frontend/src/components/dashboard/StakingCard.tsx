'use client'

import { useState } from 'react'
import { useTokenBalance, useStaking } from '@/hooks/blockchain'
import { ConnectWallet } from '@/components/web3/ConnectWallet'
import { useAccount } from 'wagmi'
import { Loader2, Coins, TrendingUp, Lock, Unlock } from 'lucide-react'

export function StakingCard() {
    const { isConnected } = useAccount()
    const { balance, isLoading: isBalanceLoading } = useTokenBalance()
    const {
        stakeInfo,
        allowance,
        approveTokens,
        stake,
        claim,
        isLoading: isStakingLoading,
        isWritePending,
        isConfirming
    } = useStaking()

    const [amount, setAmount] = useState('')
    const [habits, setHabits] = useState('1')

    const isLoading = isBalanceLoading || isStakingLoading || isWritePending || isConfirming

    const handleStake = () => {
        if (!amount || !habits) return

        // Check allowance
        if (parseFloat(allowance) < parseFloat(amount)) {
            approveTokens(amount)
        } else {
            stake(amount, parseInt(habits))
        }
    }

    const needsApproval = parseFloat(allowance) < (parseFloat(amount) || 0)

    if (!isConnected) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                <div className="p-3 bg-amber-500/10 rounded-full">
                    <Lock className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Staking Bloqueado</h3>
                    <p className="text-zinc-400 text-sm">Conecta tu wallet para empezar a ganar recompensas.</p>
                </div>
                <ConnectWallet />
            </div>
        )
    }

    return (
        <div className="w-full bg-gradient-to-r from-zinc-900/90 to-black/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-2xl">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* Left: Header & Balance */}
            <div className="flex-1 flex flex-col justify-between gap-6 border-b md:border-b-0 md:border-r border-zinc-800/50 pb-6 md:pb-0 md:pr-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                            <Coins className="w-6 h-6" />
                        </div>
                        LvlUp Staking
                    </h3>
                    <p className="text-zinc-400">Completa hábitos y multiplica tus ganancias.</p>
                </div>

                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Tu Balance</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-mono text-white tracking-tight flex items-baseline gap-1">
                            {isBalanceLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : parseFloat(balance).toFixed(2)}
                            <span className="text-sm text-zinc-500 font-sans font-normal">LVLUP</span>
                        </p>
                        <div className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            +12.5% APY
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex-[2] flex flex-col justify-center">
                {/* Active Stake Info */}
                {stakeInfo && stakeInfo.active ? (
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center w-full">
                            <p className="text-xs text-amber-500 uppercase tracking-widest font-bold mb-2">Staking Activo</p>
                            <p className="text-4xl font-bold text-white mb-1">{stakeInfo.amount}</p>
                            <p className="text-sm text-zinc-400">LVLUP Bloqueados</p>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                            <div className="bg-black/20 p-3 rounded-xl border border-zinc-800 text-center">
                                <p className="text-zinc-500 text-xs mb-1">Hábitos Restantes</p>
                                <p className="text-white font-mono text-xl">{stakeInfo.habitsRequired - stakeInfo.habitsCompleted}</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-zinc-800 text-center">
                                <p className="text-zinc-500 text-xs mb-1">Desbloqueo</p>
                                <p className="text-white font-mono text-xl">{new Date(stakeInfo.endTime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <button
                                onClick={() => claim()}
                                disabled={isLoading || !stakeInfo.claimed && Date.now() / 1000 < stakeInfo.endTime}
                                className="col-span-2 mt-2 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                                {stakeInfo.claimed ? 'Recompensa Reclamada' : 'Reclamar Rewards'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Create Stake Form */
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1 w-full">
                            <label className="text-xs text-zinc-500 ml-1 font-bold uppercase">Cantidad</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full bg-black/40 border border-zinc-800 focus:border-amber-500/50 rounded-xl py-3 px-4 text-white focus:outline-none transition-colors font-mono text-lg"
                                />
                                <button
                                    onClick={() => setAmount(balance)}
                                    className="absolute right-3 top-3.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded transition-colors uppercase font-bold tracking-wider"
                                >
                                    Max
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 w-full">
                            <label className="text-xs text-zinc-500 ml-1 font-bold uppercase">Hábitos</label>
                            <input
                                type="number"
                                value={habits}
                                onChange={(e) => setHabits(e.target.value)}
                                placeholder="7"
                                className="w-full bg-black/40 border border-zinc-800 focus:border-amber-500/50 rounded-xl py-3 px-4 text-white focus:outline-none transition-colors font-mono text-lg"
                            />
                        </div>

                        <button
                            onClick={handleStake}
                            disabled={isLoading || !amount || parseFloat(amount) <= 0}
                            className="w-full md:w-auto px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : needsApproval ? (
                                <>
                                    <Lock className="w-5 h-5" /> Aprobar
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-5 h-5" /> Stakear
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
