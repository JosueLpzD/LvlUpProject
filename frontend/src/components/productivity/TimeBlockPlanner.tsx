"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus, GripVertical, Clock, Trash2, Sparkles, CheckCircle, XCircle, Settings } from "lucide-react";
import { timeblockService, TimeBlockDTO } from "@/services/timeblockService";

// Mock Data for "My Habits" Palette
const INITIAL_HABIT_PALETTE = [
    { id: 'h1', title: 'Lectura', emoji: '📚', color: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300', shadow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' },
    { id: 'h2', title: 'Deep Work', emoji: '💻', color: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300', shadow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]' },
    { id: 'h3', title: 'Workout', emoji: '💪', color: 'bg-rose-500/10 border-rose-500/50 text-rose-300', shadow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]' },
    { id: 'h4', title: 'Meditación', emoji: '🧘‍♂️', color: 'bg-amber-500/10 border-amber-500/50 text-amber-300', shadow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]' },
    { id: 'h5', title: 'Creatividad', emoji: '🎨', color: 'bg-pink-500/10 border-pink-500/50 text-pink-300', shadow: 'shadow-[0_0_15px_-3px_rgba(236,72,153,0.4)]' },
];

const EMOJI_OPTIONS = ['📚', '💻', '💪', '🧘‍♂️', '🎨', '🎵', '🍳', '🧹', '💤', '🚶‍♂️', '📝', '🧠'];

interface TimeBlock {
    id: string;
    startHour: number;
    startMin: number; // 0, 15, 30, 45
    durationMin: number; // in minutes
    habitId: string;
    completed?: boolean;         // NEW: Track status
    hasPrompted?: boolean;       // NEW: Don't ask twice
}

export function TimeBlockPlanner() {
    const [blocks, setBlocks] = useState<TimeBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Load from API on Mount (Goodbye LocalStorage!)
    useEffect(() => {
        const loadBlocks = async () => {
            try {
                const apiBlocks = await timeblockService.getAll();
                // Transform API DTO -> Frontend Block
                const transformed: TimeBlock[] = apiBlocks.map(dto => {
                    const [sh, sm] = dto.start_time.split(':').map(Number);
                    const [eh, em] = dto.end_time.split(':').map(Number);
                    const startTotal = sh * 60 + sm;
                    const endTotal = eh * 60 + em;
                    // Handle day wrap properly if needed, for now assume same day
                    const duration = endTotal - startTotal;

                    return {
                        id: dto.id || Math.random().toString(), // Fallback if no ID
                        startHour: sh,
                        startMin: sm,
                        durationMin: duration > 0 ? duration : 30,
                        habitId: dto.habit_id,
                        completed: dto.completed
                    };
                });
                setBlocks(transformed);
            } catch (error) {
                console.error("Failed to load timeblocks:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBlocks();
    }, []);

    // Customizable Time Range State (Default 5 AM - 11 PM)
    const [config, setConfig] = useState({ startHour: 5, endHour: 21 }); // 21 is 9 PM, so range ends at 10 PM block
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Dynamic Hours Array
    const HOURS = Array.from(
        { length: config.endHour - config.startHour + 1 },
        (_, i) => config.startHour + i
    );

    const constraintsRef = useRef(null);

    const [habits, setHabits] = useState(INITIAL_HABIT_PALETTE);

    // State for "Add Habit" Modal
    const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
    const [newHabitName, setNewHabitName] = useState("");
    const [newHabitIcon, setNewHabitIcon] = useState(EMOJI_OPTIONS[0]);

    // Timer & Completion Confirmation State
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; blockId: string | null; timeLeft: number }>({
        isOpen: false, blockId: null, timeLeft: 5
    });

    // 2. Heartbeat Timer (Check completion)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentTotalMin = now.getHours() * 60 + now.getMinutes();

            blocks.forEach(block => {
                if (block.completed || block.hasPrompted) return;

                const blockEnd = block.startHour * 60 + block.startMin + block.durationMin;

                // If block ended 1 minute ago (or just now)
                if (currentTotalMin >= blockEnd) {
                    setConfirmationModal({ isOpen: true, blockId: block.id, timeLeft: 5 });
                    // Mark as prompted to avoid loop
                    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, hasPrompted: true } : b));
                }
            });
        }, 10000); // Check every 10s (for responsiveness)
        return () => clearInterval(interval);
    }, [blocks]);

    // 3. Auto-Dismiss Timer Logic
    useEffect(() => {
        if (!confirmationModal.isOpen || confirmationModal.timeLeft <= 0) return;

        const timer = setInterval(() => {
            setConfirmationModal(prev => {
                if (prev.timeLeft <= 1) {
                    // Timeout reached: Auto-mark as NOT completed (or just close)
                    return { isOpen: false, blockId: null, timeLeft: 0 };
                }
                return { ...prev, timeLeft: prev.timeLeft - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [confirmationModal.isOpen, confirmationModal.timeLeft]);

    // State for Duration Edit Modal
    const [durationModal, setDurationModal] = useState<{ isOpen: boolean; blockId: string | null; currentDuration: number }>({
        isOpen: false, blockId: null, currentDuration: 0
    });

    // State for Collision Handling
    const [collisionState, setCollisionState] = useState<{
        isOpen: boolean;
        pendingBlock: TimeBlock | null;
        conflictingIds: string[];
    }>({ isOpen: false, pendingBlock: null, conflictingIds: [] });

    // Track dragging to elevate z-index of the active row
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

    // Helper: Check for overlaps (Global Time)
    const checkOverlap = (newBlock: TimeBlock, excludeBlockId?: string) => {
        const newStartTotal = newBlock.startHour * 60 + newBlock.startMin;
        const newEndTotal = newStartTotal + newBlock.durationMin;

        // Find conflicting blocks across ALL hours
        return blocks.filter(b => {
            if (b.id === excludeBlockId) return false; // Ignore self when moving
            const bStartTotal = b.startHour * 60 + b.startMin;
            const bEndTotal = bStartTotal + b.durationMin;
            // Overlap formula: (StartA < EndB) and (EndA > StartB)
            return (newStartTotal < bEndTotal) && (newEndTotal > bStartTotal);
        }).map(b => b.id);
    };

    const addBlock = async (habitId: string, hour: number, minute: number = 0) => {
        // Calculate optimistic block for collision check
        const tempId = Math.random().toString(36).substr(2, 9);
        const duration = Math.max(15, Math.min(60, 60 - minute));

        const optimisticBlock: TimeBlock = {
            id: tempId,
            startHour: hour,
            startMin: minute,
            durationMin: duration,
            habitId
        };

        const conflicts = checkOverlap(optimisticBlock);

        if (conflicts.length > 0) {
            // Collision logic remains local for now
            setCollisionState({
                isOpen: true,
                pendingBlock: optimisticBlock,
                conflictingIds: conflicts
            });
        } else {
            // No collision -> Save to Backend
            try {
                const habit = getHabitById(habitId);
                const savedDTO = await timeblockService.create({
                    habitId,
                    title: habit?.title,
                    startHour: hour,
                    startMin: minute,
                    durationMin: duration
                });

                // Transform back to Frontend Model
                const newBlock: TimeBlock = {
                    ...optimisticBlock,
                    id: savedDTO.id || tempId, // Use real ID
                    completed: false
                };

                setBlocks(prev => [...prev, newBlock]);
            } catch (error) {
                console.error("Failed to save block", error);
            }
        }
    };

    const handleComplete = async (id: string) => {
        // 1. Optimistic Update
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, completed: true } : b));
        setConfirmationModal({ isOpen: false, blockId: null, timeLeft: 0 });

        // 2. API Call
        try {
            await timeblockService.updateStatus(id, true);
        } catch (e) {
            console.error("Failed to complete block", e);
        }
    };

    const handleDismiss = () => {
        setConfirmationModal({ isOpen: false, blockId: null, timeLeft: 0 });
    };

    const confirmReplace = () => {
        if (!collisionState.pendingBlock) return;

        setBlocks(prev => {
            // 1. Remove conflicting blocks
            const cleanBlocks = prev.filter(b => !collisionState.conflictingIds.includes(b.id));
            // 2. Add the new block
            return [...cleanBlocks, collisionState.pendingBlock!];
        });

        // Close modal
        setCollisionState({ isOpen: false, pendingBlock: null, conflictingIds: [] });
    };

    const cancelReplace = () => {
        setCollisionState({ isOpen: false, pendingBlock: null, conflictingIds: [] });
    };

    const updateBlockDuration = (id: string, deltaMin: number) => {
        setBlocks(prev => {
            const block = prev.find(b => b.id === id);
            if (!block) return prev;

            // 1. Calculate proposed duration
            const proposedDuration = block.durationMin + deltaMin;

            // 2. Find next block in the same hour to establish a "ceiling"
            const nextBlock = prev
                .filter(b => b.startHour === block.startHour && b.startMin > block.startMin && b.id !== id)
                .sort((a, b) => a.startMin - b.startMin)[0];

            // 3. Calculate max allowed duration
            // Space until next block OR end of hour (60)
            const ceilingMin = nextBlock ? nextBlock.startMin : 60;
            const maxAllowed = ceilingMin - block.startMin;

            // 4. Clamp new duration
            const newDuration = Math.max(15, Math.min(proposedDuration, maxAllowed));

            if (newDuration === block.durationMin) return prev; // No change

            return prev.map(b => b.id === id ? { ...b, durationMin: newDuration } : b);
        });
    };

    const handleOpenDurationModal = (block: TimeBlock) => {
        setDurationModal({ isOpen: true, blockId: block.id, currentDuration: block.durationMin });
    };

    const submitCustomDuration = () => {
        if (!durationModal.blockId) return;
        const block = blocks.find(b => b.id === durationModal.blockId);
        if (!block) return;

        // 1. Find next block in same hour to check gaps
        const nextBlock = blocks
            .filter(b => b.startHour === block.startHour && b.startMin > block.startMin && b.id !== block.id)
            .sort((a, b) => a.startMin - b.startMin)[0];

        // 2. Calculate Strict Limit
        const ceilingMin = nextBlock ? nextBlock.startMin : 60;
        const maxAllowed = ceilingMin - block.startMin;

        // 3. Clamp (Min 5 mins, Max calculated above)
        const newDuration = Math.max(5, Math.min(durationModal.currentDuration, maxAllowed));

        setBlocks(prev => prev.map(b => b.id === durationModal.blockId ? { ...b, durationMin: newDuration } : b));
        setDurationModal({ isOpen: false, blockId: null, currentDuration: 0 });
    };

    const removeBlock = async (id: string) => {
        // Optimistic update
        setBlocks(prev => prev.filter(b => b.id !== id));

        try {
            await timeblockService.delete(id);
        } catch (error) {
            console.error("Failed to delete block", error);
        }
    };

    const getHabitById = (id: string) => habits.find(h => h.id === id);

    const handleCreateHabit = () => {
        if (!newHabitName.trim()) return;
        const newHabit = {
            id: `h${Date.now()}`,
            title: newHabitName,
            emoji: newHabitIcon,
            color: 'bg-zinc-500/10 border-zinc-500/50 text-zinc-300',
            shadow: 'shadow-[0_0_15px_-3px_rgba(113,113,122,0.4)]'
        };
        setHabits([...habits, newHabit]);
        setNewHabitName("");
        setIsAddHabitOpen(false);
    };

    const moveBlock = (blockId: string, newHour: number, newMin: number) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        // Clamp duration if it exceeds the hour boundary
        const maxDuration = 60 - newMin;
        const clampedDuration = Math.min(block.durationMin, maxDuration);

        const updatedBlock = {
            ...block,
            startHour: newHour,
            startMin: newMin,
            durationMin: clampedDuration
        };

        // Check conflicts excluding itself
        const conflicts = checkOverlap(updatedBlock, blockId);

        if (conflicts.length > 0) {
            setCollisionState({
                isOpen: true,
                pendingBlock: updatedBlock,
                conflictingIds: conflicts
            });
        } else {
            setBlocks(prev => prev.map(b => b.id === blockId ? updatedBlock : b));
        }
    };

    return (
        <div className="flex flex-row h-full gap-6 p-2" ref={constraintsRef} data-component="TimeBlockPlanner">

            {/* COMPLETION CONFIRMATION MODAL */}
            {confirmationModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1e202e] border border-emerald-500/50 p-6 rounded-2xl shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)] max-w-sm w-full relative overflow-hidden">
                        {/* Progress Bar Background */}
                        <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(confirmationModal.timeLeft / 5) * 100}%` }} />

                        <div className="flex flex-col gap-4 text-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">¿Terminaste?</h3>
                                <p className="text-zinc-400">
                                    El tiempo de esta actividad ha terminado.<br />
                                    <span className="text-emerald-400 font-bold">¿La completaste con éxito?</span>
                                </p>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 transition-colors"
                                >
                                    No ({confirmationModal.timeLeft}s)
                                </button>
                                <button
                                    onClick={() => confirmationModal.blockId && handleComplete(confirmationModal.blockId)}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
                                >
                                    ¡SÍ!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COLLISION CONFIRMATION MODAL */}
            {collisionState.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e202e] border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col gap-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">¿Reemplazar actividad?</h3>
                                <p className="text-zinc-400 text-sm">
                                    Ya existe una actividad en ese horario. <br />
                                    ¿Quieres reemplazarla por la nueva?
                                </p>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={cancelReplace}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReplace}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20"
                                >
                                    Reemplazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1.5. ADD HABIT MODAL */}
            {isAddHabitOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e202e] border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Hábito</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={newHabitName}
                                    onChange={(e) => setNewHabitName(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="Ej: Yoga"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Icono</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setNewHabitIcon(emoji)}
                                            className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-700 transition-colors",
                                                newHabitIcon === emoji ? "bg-amber-500/20 border border-amber-500" : "bg-zinc-800"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setIsAddHabitOpen(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300">Cancelar</button>
                                <button onClick={handleCreateHabit} className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-bold">Crear</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1.6. CUSTOM DURATION MODAL */}
            {durationModal.isOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e202e] border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Ajustar Duración</h3>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-400 mb-2 block">
                                    Duración en minutos (Máx disponible: {(() => {
                                        if (!durationModal.blockId) return 60;
                                        const block = blocks.find(b => b.id === durationModal.blockId);
                                        if (!block) return 60;
                                        const nextBlock = blocks
                                            .filter(b => b.startHour === block.startHour && b.startMin > block.startMin && b.id !== block.id)
                                            .sort((a, b) => a.startMin - b.startMin)[0];
                                        return nextBlock ? nextBlock.startMin - block.startMin : 60 - block.startMin;
                                    })()})
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDurationModal(prev => ({ ...prev, currentDuration: Math.max(5, prev.currentDuration - 5) }))}
                                        className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                                    >-</button>
                                    <input
                                        type="number"
                                        value={durationModal.currentDuration}
                                        onChange={(e) => setDurationModal(prev => ({ ...prev, currentDuration: Number(e.target.value) }))}
                                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center font-mono focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={() => setDurationModal(prev => ({ ...prev, currentDuration: Math.min(60, prev.currentDuration + 5) }))}
                                        className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setDurationModal({ isOpen: false, blockId: null, currentDuration: 0 })} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancelar</button>
                                <button onClick={submitCustomDuration} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1.7. CONFIGURATION MODAL */}
            {isConfigOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e202e] border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-zinc-700/50 text-zinc-200 rounded-lg">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Configurar Horario</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Hora Inicio (0-23)</label>
                                <input
                                    type="number"
                                    min="0" max="23"
                                    value={config.startHour}
                                    onChange={(e) => setConfig(prev => ({ ...prev, startHour: Math.min(Number(e.target.value), prev.endHour - 1) }))}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Hora Fin (0-23)</label>
                                <input
                                    type="number"
                                    min="0" max="23"
                                    value={config.endHour}
                                    onChange={(e) => setConfig(prev => ({ ...prev, endHour: Math.max(Number(e.target.value), prev.startHour + 1) }))}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsConfigOpen(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Habit Compact Palette (Sidebar) - Added z-50 for drag visibility */}
            <div className="w-20 md:w-24 flex flex-col items-center gap-4 bg-[#181a25]/90 backdrop-blur-xl border border-zinc-800 py-6 rounded-3xl shadow-2xl shrink-0 h-[85vh] sticky top-4 z-50">
                <div className="mb-2 flex flex-col items-center">
                    <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                        <Sparkles size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest rotate-180 md:rotate-0 writing-mode-vertical md:writing-mode-horizontal">Inventario</span>
                </div>

                <div className="flex flex-col gap-4 w-full px-2 overflow-y-auto no-scrollbar items-center pb-4">
                    <button
                        onClick={() => setIsAddHabitOpen(true)}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 flex items-center justify-center transition-all shrink-0 text-zinc-500 hover:text-amber-500"
                    >
                        <Plus size={24} />
                    </button>

                    {habits.map(habit => (
                        <motion.div
                            key={habit.id}
                            drag
                            dragSnapToOrigin
                            whileHover={{ scale: 1.1, zIndex: 50 }}
                            whileDrag={{ scale: 1.2, zIndex: 100, cursor: "grabbing" }}
                            dragConstraints={constraintsRef}
                            onDragEnd={(event, info) => {
                                // Magic: Detect drop target and exact position using elementsFromPoint to penetrate dragged item
                                const clientX = (event as any).clientX || (event as any).changedTouches?.[0]?.clientX || 0;
                                const clientY = (event as any).clientY || (event as any).changedTouches?.[0]?.clientY || 0;

                                const elements = document.elementsFromPoint(clientX, clientY);
                                const hourRow = elements.find(el => el.hasAttribute('data-hour'));

                                if (hourRow) {
                                    const hour = Number(hourRow.getAttribute('data-hour'));

                                    // Calculate relative X position to determine minute (Horizontal Time Axis)
                                    const rect = hourRow.getBoundingClientRect();
                                    const offsetX = clientX - rect.left;
                                    const percent = offsetX / rect.width;
                                    // Snap to nearest 15 mins (0, 0.25, 0.5, 0.75)
                                    let minute = 0;
                                    if (percent > 0.75) minute = 45;
                                    else if (percent > 0.5) minute = 30;
                                    else if (percent > 0.25) minute = 15;

                                    addBlock(habit.id, hour, minute);
                                }
                            }}
                            className={cn(
                                "relative w-14 h-14 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center cursor-grab active:cursor-grabbing transition-all shrink-0",
                                habit.color.replace('text-', '').split(' ')[0], // bg color
                                habit.color.split(' ').find(c => c.startsWith('border-')), // border color
                                (habit as any).shadow
                            )}
                        >
                            <span className="text-2xl md:text-3xl filter drop-shadow-md select-none pointer-events-none">{habit.emoji}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 2. Timeline Grid (Main Stage) */}
            <div className="flex-1 bg-[#13151b] border border-zinc-800 rounded-[2rem] shadow-2xl relative flex flex-col h-full overflow-hidden">
                {/* Header Date */}
                <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-[#181a25] shrink-0 z-20">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter capitalize">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-teal-400 font-bold bg-teal-400/10 px-2 py-0.5 rounded text-sm">Hoy</span>
                            <span className="text-zinc-500 font-medium text-sm">{(config.endHour - config.startHour + 1)} horas activas</span>
                        </div>
                    </div>

                    {/* Settings Button */}
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Configurar Horario"
                    >
                        <Settings size={20} />
                    </button>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
                    {HOURS.map(hour => {
                        return (
                            <div
                                key={hour}
                                data-hour={hour}
                                className={cn(
                                    "group flex relative h-[160px] border-b border-zinc-800/40 hover:bg-white/[0.01] transition-colors",
                                    // Elevate z-index if a block in this row is being dragged
                                    blocks.some(b => b.startHour === hour && b.id === draggingBlockId) ? "z-50" : "z-0"
                                )}
                            >
                                {/* Time Label - Added 'border border-red-500' for identification */}
                                <div className="w-32 py-4 pr-8 text-right border-r border-zinc-800/40 shrink-0 sticky left-0 bg-[#13151b]/95 z-20 backdrop-blur-sm border border-red-500">
                                    <span className="text-2xl font-bold text-zinc-500 font-mono leading-none tracking-tighter block">{hour}:00</span>
                                </div>

                                {/* Drop Zone Area */}
                                <div className="flex-1 relative ">


                                    {/* Render Blocks with Horizontal Layout Logic */}
                                    {(() => {
                                        const hourBlocks = blocks.filter(b => b.startHour === hour);

                                        // "Uno al lado del otro" inside the calendar row
                                        return hourBlocks.map((block, index) => {
                                            const habit = getHabitById(block.habitId);
                                            if (!habit) return null;

                                            // HORIZONTAL TIME AXIS LOGIC
                                            // 1. Width = Duration (e.g., 30m = 50% of the row width)
                                            const widthPercent = (block.durationMin / 60) * 100;

                                            // 2. Left Position = Start Minute (e.g., 30m past hour = Starts at 50%)
                                            const leftPercent = (block.startMin / 60) * 100;

                                            // 3. Vertical Fill = Occupy full height
                                            const topPercent = 0;
                                            const heightPercent = 100;

                                            return (
                                                <motion.div
                                                    key={block.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                        width: `${widthPercent}%`,
                                                        left: `${leftPercent}%`,
                                                        top: `${topPercent}%`,
                                                        height: `calc(${heightPercent}% - 4px)`
                                                    }}
                                                    drag
                                                    dragSnapToOrigin
                                                    dragConstraints={constraintsRef}
                                                    dragMomentum={false}
                                                    whileDrag={{ scale: 1.05, zIndex: 100, cursor: "grabbing" }}
                                                    onDragStart={() => setDraggingBlockId(block.id)}
                                                    onDragEnd={(event, info) => {
                                                        setDraggingBlockId(null);
                                                        const clientX = (event as any).clientX || (event as any).changedTouches?.[0]?.clientX || 0;
                                                        const clientY = (event as any).clientY || (event as any).changedTouches?.[0]?.clientY || 0;

                                                        const elements = document.elementsFromPoint(clientX, clientY);
                                                        const hourRow = elements.find(el => el.hasAttribute('data-hour'));

                                                        if (hourRow) {
                                                            const hour = Number(hourRow.getAttribute('data-hour'));
                                                            const rect = hourRow.getBoundingClientRect();
                                                            const offsetX = clientX - rect.left;
                                                            const percent = offsetX / rect.width;
                                                            let minute = 0;
                                                            if (percent > 0.75) minute = 45;
                                                            else if (percent > 0.5) minute = 30;
                                                            else if (percent > 0.25) minute = 15;

                                                            moveBlock(block.id, hour, minute);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "absolute rounded-xl border pl-2 pr-1 flex items-center overflow-hidden group/block z-10 transition-all cursor-grab active:cursor-grabbing",
                                                        habit.color, // Apply full color set: bg, border, text
                                                        (habit as any).shadow,
                                                        "hover:brightness-110",
                                                        block.completed && "opacity-60 saturate-50 border-emerald-500/50 bg-emerald-900/10"
                                                    )}
                                                    // Remove custom style override since we use real classes now
                                                    style={{}}
                                                >
                                                    {/* Internal Layout for Squared/Compact Blocks */}
                                                    <div className="flex flex-col md:flex-row items-start gap-2 overflow-hidden w-full h-full p-2">
                                                        <div className={cn("w-6 h-6 md:w-8 md:h-8 rounded-md flex items-center justify-center text-sm md:text-lg shadow-inner bg-black/20 shrink-0 relative", habit.color.split(' ')[0])}>
                                                            {block.completed ? <CheckCircle size={14} className="text-emerald-400" /> : habit.emoji}
                                                        </div>
                                                        <div className="min-w-0 flex-1 leading-none">
                                                            <h4 className={cn("font-bold text-white truncate text-xs md:text-sm", block.completed && "line-through text-zinc-400")}>{habit.title}</h4>
                                                            {block.durationMin > 0 && (
                                                                <span className="text-[9px] font-mono text-zinc-500 opacity-70">
                                                                    {block.durationMin}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Resize / Delete Controls - Internal overlay */}
                                                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity bg-black/60 p-0.5 rounded backdrop-blur-sm z-50">
                                                        {!block.completed && (
                                                            <button onClick={(e) => { e.stopPropagation(); handleComplete(block.id); }} className="p-0.5 hover:text-emerald-400 text-zinc-300" title="Marcar como completado"><CheckCircle size={10} /></button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-0.5 hover:text-red-500 text-zinc-300"><Trash2 size={10} /></button>
                                                        <div className="flex flex-col gap-0.5">
                                                            <button onClick={(e) => { e.stopPropagation(); updateBlockDuration(block.id, -15); }} className="w-3 h-3 bg-zinc-700 text-[8px] hover:bg-zinc-600 rounded flex items-center justify-center text-white">-</button>
                                                            <button onClick={(e) => { e.stopPropagation(); updateBlockDuration(block.id, 15); }} className="w-3 h-3 bg-zinc-700 text-[8px] hover:bg-zinc-600 rounded flex items-center justify-center text-white">+</button>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenDurationModal(block); }} className="p-0.5 hover:text-blue-400 text-zinc-300" title="Personalizar tiempo"><Clock size={10} /></button>
                                                    </div>
                                                </motion.div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )
                    })}



                </div>
            </div>

        </div>
    );
}
