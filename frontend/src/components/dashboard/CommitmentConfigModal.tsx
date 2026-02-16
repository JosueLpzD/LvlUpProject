'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Crosshair, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils'; // Asumiendo que existe, si no usaré classnames o template literals

interface Habit {
    id: string;
    title: string;
    emoji: string;
}

interface CommitmentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mode: 'HARD' | 'CUSTOM', selectedIds: string[]) => void;
    habits: Habit[];
}

export function CommitmentConfigModal({ isOpen, onClose, onConfirm, habits }: CommitmentConfigModalProps) {
    const [mode, setMode] = useState<'HARD' | 'CUSTOM'>('HARD');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    if (!isOpen) return null;

    const toggleHabit = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (mode === 'CUSTOM' && selectedIds.length === 0) {
            alert("Selecciona al menos un hábito para el modo Custom.");
            return;
        }
        onConfirm(mode, selectedIds);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 p-6">
                    <h2 className="text-xl font-bold text-white">Configura tu Compromiso</h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMode('HARD')}
                            className={cn(
                                "flex flex-col items-center gap-3 rounded-xl border p-4 transition-all text-center",
                                mode === 'HARD'
                                    ? "bg-red-500/10 border-red-500 text-red-400 ring-2 ring-red-500/20"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                        >
                            <div className="p-3 rounded-full bg-red-500/20 text-red-500">
                                <Flame size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Modo HARD</h3>
                                <p className="text-xs opacity-80 mt-1">Todo cuenta. Si fallas uno, pagas.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('CUSTOM')}
                            className={cn(
                                "flex flex-col items-center gap-3 rounded-xl border p-4 transition-all text-center",
                                mode === 'CUSTOM'
                                    ? "bg-blue-500/10 border-blue-500 text-blue-400 ring-2 ring-blue-500/20"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                        >
                            <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
                                <Crosshair size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Modo CUSTOM</h3>
                                <p className="text-xs opacity-80 mt-1">Elige tus batallas con precisión.</p>
                            </div>
                        </button>
                    </div>

                    {/* Custom Selection Area */}
                    <AnimatePresence>
                        {mode === 'CUSTOM' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Selecciona los hábitos a comprometer:</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {habits.length > 0 ? habits.map(habit => (
                                        <button
                                            key={habit.id}
                                            onClick={() => toggleHabit(habit.id)}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg border text-sm transition-all text-left",
                                                selectedIds.includes(habit.id)
                                                    ? "bg-blue-500/20 border-blue-500/50 text-white"
                                                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                                            )}
                                        >
                                            <span>{habit.emoji}</span>
                                            <span className="truncate">{habit.title}</span>
                                            {selectedIds.includes(habit.id) && <Check size={14} className="ml-auto text-blue-400" />}
                                        </button>
                                    )) : (
                                        <p className="col-span-3 text-center text-xs text-zinc-500 italic py-4">
                                            No hay hábitos en tu planificador.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={cn(
                            "flex-[2] py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                            mode === 'HARD'
                                ? "bg-red-600 hover:bg-red-500 shadow-red-900/20"
                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                        )}
                    >
                        {mode === 'HARD' ? <Flame size={18} /> : <Shield size={18} />}
                        Confirmar {mode}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
