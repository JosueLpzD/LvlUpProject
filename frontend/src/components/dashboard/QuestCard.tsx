"use client";

import { Habit, ATTRIBUTE_COLORS } from "@/lib/gamification/types";
import { useGameStore } from "@/lib/store/gameStore";
import { motion } from "framer-motion";
import { Check, Flame, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuestCardProps {
    habit: Habit;
    contractInfo?: {
        active: boolean;
        txHash?: string;
        amount?: string;
        mode?: string;
        status?: string;
        settlementTxHash?: string;
        amountReturned?: string;
    };
}

export function QuestCard({ habit, contractInfo }: QuestCardProps) {
    const completeHabit = useGameStore((state) => state.completeHabit);
    const isCompletedToday = habit.completedDates.includes(new Date().toISOString().split('T')[0]);
    const [isPressing, setIsPressing] = useState(false);

    const handleComplete = () => {
        if (!isCompletedToday) {
            completeHabit(habit.id);
            // TODO: Add sound effect here
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 select-none cursor-pointer group",
                isCompletedToday
                    ? "bg-zinc-900 border-zinc-800 opacity-80"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
            )}
            onPointerDown={() => !isCompletedToday && setIsPressing(true)}
            onPointerUp={() => setIsPressing(false)}
            onPointerLeave={() => setIsPressing(false)}
            onClick={handleComplete} // Simple click for now, can implement long-press later if requested
            data-component="QuestCard"
        >
            {/* Contract Settled Badge (Win/Loss) */}
            {contractInfo?.active && contractInfo.status === 'SETTLED' && (
                <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                    <a
                        href={`https://sepolia.basescan.org/tx/${contractInfo.settlementTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border shadow-lg transition-colors",
                            parseFloat(contractInfo.amountReturned || '0') >= parseFloat(contractInfo.amount || '0')
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40"
                        )}
                    >
                        {parseFloat(contractInfo.amountReturned || '0') >= parseFloat(contractInfo.amount || '0') ? "🏆 WIN" : "💀 LOSS"}
                        <span className="text-[8px] font-mono opacity-80 ml-1">TX: {contractInfo.settlementTxHash?.slice(0, 4)}...</span>
                    </a>
                    <span className="text-[9px] text-zinc-400 ml-1 font-mono">
                        Devuelto: {parseFloat(contractInfo.amountReturned || '0').toFixed(4)} ETH
                    </span>
                </div>
            )}

            {/* Contract Active Badge (In Progress) */}
            {contractInfo?.active && contractInfo.status !== 'SETTLED' && (
                <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
                    <a
                        href={`https://sepolia.basescan.org/tx/${contractInfo.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} // Prevent completing habit when clicking link
                        className={cn("flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                            contractInfo.mode === 'HARD'
                                ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/40"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/40"
                        )}
                    >
                        {contractInfo.mode === 'HARD' ? <Flame size={10} /> : <ShieldCheck size={10} />}
                        {contractInfo.mode} TX: {contractInfo.txHash?.slice(0, 4)}...{contractInfo.txHash?.slice(-4)}
                    </a>
                    {contractInfo.amount && (
                        <span className="text-[9px] text-zinc-500 ml-1">
                            Pool: {parseFloat(contractInfo.amount).toFixed(4)} ETH
                        </span>
                    )}
                </div>
            )}

            {/* Progress Fill Background for Long Press (Visual Feedback) */}
            {/* Simplified interaction: Click to complete for MVP responsiveness */}

            <div className="flex items-center justify-between gap-4 mt-4"> {/* Added margin-top to clear badge */}
                <div className="flex items-center gap-4" data-component="QuestInfo">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors",
                        isCompletedToday ? "bg-green-900/20 text-green-500" : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-800/80"
                    )}>
                        {isCompletedToday ? <Check size={24} /> : <span>{habit.difficulty === 'epic' ? '🗡️' : '⚔️'}</span>}
                    </div>

                    <div>
                        <h3 className={cn("font-bold text-lg", isCompletedToday ? "text-zinc-500 line-through" : "text-zinc-100")}>
                            {habit.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className={cn("px-1.5 py-0.5 rounded text-white font-bold uppercase text-[10px]", ATTRIBUTE_COLORS[habit.attribute])}>
                                {habit.attribute}
                            </span>
                            <span>+{habit.xpValue} XP</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1" data-component="QuestStreak">
                    {habit.streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                            <Flame size={14} className={cn(habit.streak > 5 && "fill-orange-500 animate-pulse")} />
                            {habit.streak}
                        </div>
                    )}
                </div>
            </div>

            {/* Difficulty Indicator Banner */}
            <div className={cn("absolute top-0 right-0 w-16 h-16 pointer-events-none")}>
                <div className={cn(
                    "absolute transform rotate-45 bg-zinc-800 text-[9px] text-center text-white font-bold py-0.5 w-[100px] top-[10px] -right-[30px]",
                    habit.difficulty === 'easy' && "bg-green-600",
                    habit.difficulty === 'medium' && "bg-blue-600",
                    habit.difficulty === 'hard' && "bg-orange-600",
                    habit.difficulty === 'epic' && "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                )}>
                    {habit.difficulty}
                </div>
            </div>

        </motion.div>
    );
}
