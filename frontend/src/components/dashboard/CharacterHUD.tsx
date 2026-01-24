"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Coins, User } from "lucide-react";
import { motion } from "framer-motion";
import { LEVEL_THRESHOLDS } from "@/lib/gamification/types";
import { useEffect, useState } from "react";

export function CharacterHUD() {
    const { user } = useGameStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-24 bg-zinc-900 border-b border-zinc-800 animate-pulse"></div>;

    // Calculate XP progress to next level
    const currentLevelData = LEVEL_THRESHOLDS.find((l) => l.level === user.stats.level) || LEVEL_THRESHOLDS[0];
    const nextLevelData = LEVEL_THRESHOLDS.find((l) => l.level === user.stats.level + 1);

    let progress = 100;
    let xpForNextLevel = 0;
    let currentLevelXP = 0;

    if (nextLevelData) {
        const range = nextLevelData.minXP - currentLevelData.minXP;
        currentLevelXP = user.stats.totalXP - currentLevelData.minXP;
        progress = (currentLevelXP / range) * 100;
        xpForNextLevel = range;
    }

    return (
        <div className="sticky top-0 z-50 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800 shadow-lg p-4" data-component="CharacterHUD">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

                {/* Avatar & Level */}
                <div className="flex items-center gap-4" data-component="UserAvatar">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-lg">
                            <User className="text-white w-6 h-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-zinc-900 text-xs font-bold px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">
                            Lvl {user.stats.level}
                        </div>
                    </div>

                    <div className="hidden sm:block">
                        <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{currentLevelData.title}</div>
                        <div className="font-bold text-lg text-white leading-none">{user.name}</div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="flex-1 max-w-md flex flex-col gap-1" data-component="XPBar">
                    <div className="flex justify-between text-xs font-medium px-1">
                        <span className="text-yellow-500 flex items-center gap-1"><Trophy size={12} /> {user.stats.totalXP.toLocaleString()} XP</span>
                        <span className="text-zinc-500">{nextLevelData ? `${Math.floor(progress)}%` : 'MAX'}</span>
                    </div>
                    <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 10 }}
                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 relative"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}></div>
                        </motion.div>
                    </div>
                    {nextLevelData && <div className="text-[10px] text-zinc-600 text-right">Sig.: {nextLevelData.minXP} XP</div>}
                </div>

                {/* Currency */}
                <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex flex-col items-end">
                        <div className="text-xs text-zinc-500 uppercase font-bold">Oro</div>
                        <div className="text-yellow-400 font-mono font-bold flex items-center gap-1">
                            <Coins size={14} />
                            {user.stats.gold.toLocaleString()}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
