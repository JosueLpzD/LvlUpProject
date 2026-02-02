"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { ATTRIBUTE_COLORS, LEVEL_THRESHOLDS } from "@/lib/gamification/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, Star } from "lucide-react";

interface SkillTrackProps {
    attribute: keyof typeof ATTRIBUTE_COLORS;
    label: string;
}

export function SkillTrack({ attribute, label }: SkillTrackProps) {
    const { user } = useGameStore();
    const currentXP = user.stats.attributes[attribute] || 0;

    // Find current level for this specific attribute based on global thresholds (simplified logic)
    // In a real RPG, each skill might have its own curve, but we'll use the global one for consistency
    let currentLevel = 1;
    let currentThreshold = LEVEL_THRESHOLDS[0];
    let nextThreshold = LEVEL_THRESHOLDS[1];

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (currentXP >= LEVEL_THRESHOLDS[i].minXP) {
            currentLevel = LEVEL_THRESHOLDS[i].level;
            currentThreshold = LEVEL_THRESHOLDS[i];
            nextThreshold = LEVEL_THRESHOLDS[i + 1];
        } else {
            break;
        }
    }

    const range = (nextThreshold?.minXP || currentXP) - currentThreshold.minXP;
    const progressXP = currentXP - currentThreshold.minXP;
    const progressPercent = nextThreshold ? (progressXP / range) * 100 : 100;

    const colorClass = ATTRIBUTE_COLORS[attribute]; // e.g. bg-blue-500

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6" data-component="SkillTrack">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3" data-component="SkillHeader">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg", colorClass)}>
                        <Star size={20} className="fill-white/20" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{label}</h3>
                        <div className="text-xs text-zinc-500 font-medium">Nivel {currentLevel}: {currentThreshold.title}</div>
                    </div>
                </div>
                <div className="text-right" data-component="SkillStats">
                    <div className="text-2xl font-bold text-white font-mono">{currentXP.toLocaleString()}</div>
                    <div className="text-xs text-zinc-600 uppercase">XP Total</div>
                </div>
            </div>

            {/* Track Visualization */}
            <div className="relative pt-6 pb-2" data-component="ProgressBar">
                {/* Milestone Markers */}
                <div className="absolute top-0 left-0 right-0 flex justify-between text-xs font-bold text-zinc-600 px-1">
                    <span>Lvl {currentLevel}</span>
                    <span>Lvl {currentLevel + 1}</span>
                </div>

                <div className="h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative">
                    <motion.div
                        className={cn("h-full relative", colorClass)}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </motion.div>
                </div>

                {!nextThreshold && (
                    <div className="mt-2 text-center text-xs text-yellow-500 font-bold">¡MAESTRÍA MÁXIMA ALCANZADA!</div>
                )}
            </div>
        </div>
    );
}
