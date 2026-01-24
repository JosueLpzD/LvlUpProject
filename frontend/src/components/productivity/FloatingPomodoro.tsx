"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, X, Minimize2, Maximize2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ReactNode }> = {
    focus: { label: "Focus", minutes: 25, color: "text-teal-400", icon: <Brain size={16} /> },
    shortBreak: { label: "Short", minutes: 5, color: "text-blue-400", icon: <Coffee size={16} /> },
    longBreak: { label: "Long", minutes: 15, color: "text-indigo-400", icon: <Coffee size={16} /> },
};

export function FloatingPomodoro() {
    const [isOpen, setIsOpen] = useState(false); // Start minimized/hidden-ish? Or just collapsed
    const [mode, setMode] = useState<TimerMode>("focus");
    const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const constraintsRef = useRef(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Logic for completion sound/notification
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTimeLeft(MODES[mode].minutes * 60); };
    const changeMode = (m: TimerMode) => { setMode(m); setIsActive(false); setTimeLeft(MODES[m].minutes * 60); };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

    return (
        <>
            {/* Constraints container - usually the viewport/body, but here we let it float freely or restrict to screen */}

            <motion.div
                drag
                dragMomentum={false}
                initial={{ bottom: 20, right: 20, x: 0, y: 0 }}
                className="fixed z-50 shadow-2xl"
                style={{ touchAction: "none" }} // Important for mobile drag
                data-component="FloatingPomodoro"
            >
                <AnimatePresence mode="wait">
                    {!isOpen ? (
                        <motion.button
                            key="minimized"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={() => setIsOpen(true)}
                            className="bg-teal-500 hover:bg-teal-400 text-zinc-900 p-4 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.5)] flex items-center justify-center font-bold relative group"
                        >
                            <Timer size={24} />
                            {isActive && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                    {formatTime(timeLeft)}
                                </span>
                            )}
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#1e202e]/95 backdrop-blur-md border border-[#2f334d] rounded-2xl p-6 w-[320px] flex flex-col gap-4 overflow-hidden relative"
                        >
                            {/* Drag Handle */}
                            <div className="absolute top-0 left-0 w-full h-6 bg-white/5 cursor-move flex justify-center items-center">
                                <div className="w-8 h-1 bg-white/10 rounded-full" />
                            </div>

                            {/* Header Controls */}
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    {MODES[mode].icon} {MODES[mode].label}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white"><Minimize2 size={16} /></button>
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center py-4 relative">
                                <div className={cn("text-6xl font-black font-mono tracking-tighter tabular-nums relative z-10", MODES[mode].color)}>
                                    {formatTime(timeLeft)}
                                </div>
                                {/* Background Progress expansion? Or simple bar */}
                                <div className="w-full h-1 bg-zinc-800 mt-4 rounded-full overflow-hidden">
                                    <motion.div
                                        className={cn("h-full", mode === 'focus' ? "bg-teal-500" : "bg-indigo-500")}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center gap-4">
                                <button onClick={toggleTimer} className={cn("p-4 rounded-full text-zinc-900 shadow-lg transition-transform active:scale-95", isActive ? "bg-amber-400" : "bg-teal-400")}>
                                    {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                                </button>
                                <button onClick={resetTimer} className="p-4 rounded-full bg-[#252836] text-zinc-400 hover:bg-[#2f334d] hover:text-white">
                                    <RotateCcw size={20} />
                                </button>
                            </div>

                            {/* Mode Switcher */}
                            <div className="flex justify-center gap-2 mt-2">
                                {(Object.keys(MODES) as TimerMode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => changeMode(m)}
                                        className={cn("w-2 h-2 rounded-full transition-all", mode === m ? MODES[m].color.replace('text-', 'bg-') : "bg-zinc-700 hover:bg-zinc-600")}
                                    />
                                ))}
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}
