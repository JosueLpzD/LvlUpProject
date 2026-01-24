"use client";

import { Habit, ATTRIBUTE_COLORS } from "@/lib/gamification/types";
import { motion } from "framer-motion";
import { Check, Flame, Book, Dumbbell, Brain, Zap } from "lucide-react"; // Default icons
import { cn } from "@/lib/utils";

interface HabitSquareProps {
    habit: Habit;
    isCompleted: boolean;
    onToggle: () => void;
}

// Map attributes/names to icons (Simple helper, preferably move to a utility or stick to the Habit type if it had an icon field)
const getIcon = (title: string, attribute: string) => {
    // Simple heuristic for demo purposes
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("leer") || lowerTitle.includes("lectura")) return <Book size={20} />;
    if (lowerTitle.includes("entreno") || lowerTitle.includes("gym")) return <Dumbbell size={20} />;
    if (attribute === "intellect") return <Brain size={20} />;
    if (attribute === "strength") return <Dumbbell size={20} />;
    return <Zap size={20} />;
};

export function HabitSquare({ habit, isCompleted, onToggle }: HabitSquareProps) {

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={cn(
                "relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 w-full aspect-square",
                isCompleted
                    ? "bg-teal-400 border-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)] text-zinc-900"
                    : "bg-[#252836] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-[#2d303e]"
            )}
            data-component="HabitSquare"
        >
            {/* Icon */}
            <div className={cn(
                "text-2xl mb-1",
                isCompleted ? "text-zinc-900" : "text-zinc-500" // Icon color logic
            )}>
                {/* Use emoji if available purely, or Icon helper */}
                {getIcon(habit.title, habit.attribute)}
            </div>

            {/* Label */}
            <div className="flex flex-col items-center leading-none">
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-center line-clamp-2",
                    isCompleted ? "text-zinc-900" : "text-zinc-300"
                )}>
                    {habit.title}
                </span>
                <span className={cn(
                    "text-[9px] mt-1 font-mono",
                    isCompleted ? "text-zinc-800/80" : "text-zinc-500"
                )}>
                    XP {habit.xpValue}
                </span>
            </div>

        </motion.button>
    );
}
