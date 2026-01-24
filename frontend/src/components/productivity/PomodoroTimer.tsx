"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface PomodoroTimerProps {
    onComplete?: (mode: TimerMode) => void;
    className?: string;
}

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode }> = {
    focus: { label: "Focus", minutes: 25, color: "text-teal-400", icon: <Brain size={16} /> },
    shortBreak: { label: "Short Break", minutes: 5, color: "text-blue-400", icon: <Coffee size={16} /> },
    longBreak: { label: "Long Break", minutes: 15, color: "text-indigo-400", icon: <Coffee size={16} /> },
};

export function PomodoroTimer({ onComplete, className }: PomodoroTimerProps) {
    const [mode, setMode] = useState<TimerMode>("focus");
    const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (onComplete) onComplete(mode);
            // Play sound or notification logic here
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, onComplete]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].minutes * 60);
    };

    const changeMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(MODES[newMode].minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

    return (
        <div
            className={cn(
                "bg-[#1e202e] border border-[#2f334d] rounded-2xl p-6 shadow-xl flex flex-col items-center gap-6 relative overflow-hidden",
                className
            )}
            data-component="PomodoroTimer"
        >
            {/* Background Progress Bar (Subtle) */}
            <div className="absolute bottom-0 left-0 h-1 bg-[#2f334d] w-full">
                <motion.div
                    className={cn("h-full", mode === 'focus' ? "bg-teal-500" : "bg-blue-500")}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                />
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 bg-[#252836] p-1 rounded-xl">
                {(Object.keys(MODES) as TimerMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => changeMode(m)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            mode === m
                                ? "bg-[#2f334d] text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {MODES[m].icon}
                        {MODES[m].label}
                    </button>
                ))}
            </div>

            {/* Timer Display */}
            <div className="relative z-10">
                <div className={cn("text-7xl font-black font-mono tracking-tighter tabular-nums", MODES[mode].color)}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTimer}
                    className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center text-zinc-900 shadow-lg transition-transform active:scale-95",
                        isActive ? "bg-amber-400 hover:bg-amber-300" : "bg-teal-400 hover:bg-teal-300"
                    )}
                >
                    {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-full bg-[#252836] text-zinc-400 flex items-center justify-center hover:bg-[#2f334d] hover:text-white transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
}
