"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { QuestCard } from "./QuestCard";
import { motion } from "framer-motion";

export function ActiveQuestBoard() {
    const { habits } = useGameStore();

    const activeHabits = habits; // Can filter by 'isDaily' or 'active' later

    return (
        <div className="space-y-6" data-component="ActiveQuestBoard">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📜</span> Misiones Activas
                </h2>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Hoy</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activeHabits.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                        No hay misiones activas. ¡Añade una hábito para comenzar tu aventura!
                    </div>
                ) : (
                    activeHabits.map((habit, index) => (
                        <motion.div
                            key={habit.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <QuestCard habit={habit} />
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
