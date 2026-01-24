"use client";

import { Habit } from "@/lib/gamification/types";
import { HabitSquare } from "./HabitSquare";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/store/gameStore";

interface DayCardProps {
    date: Date;
    habits: Habit[];
}

export function DayCard({ date, habits }: DayCardProps) {
    const { completeHabit, user } = useGameStore();

    // Format Date: "Mon" "12-22"
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' }).replace('/', '-');
    const dateKey = date.toISOString().split('T')[0];
    const isToday = dateKey === new Date().toISOString().split('T')[0];

    // Calculate Progress
    const completedCount = habits.filter(h => h.completedDates.includes(dateKey)).length;
    const totalCount = habits.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const handleToggle = (habitId: string) => {
        // In this app logic, we mostly just toggle "today", completing retroactively might need logic adjustment in store
        // For now, assuming we can only toggle if it corresponds to the current logic or if store supports it.
        // Store 'completeHabit' checks for "today" internally usually? Let's check store logic later.
        // For visual demo, we trigger action. The store might limit past dates.

        // If it's today, standard toggle. 
        if (isToday) {
            completeHabit(habitId);
        } else {
            // Todo: Add Support in store for toggling specific dates if needed.
            // For now, allow completing "as if today" or show warning? 
            // Let's just trigger it, store usually pushes current date.
            // Actually for the "Calendar View" to work fully, the store needs to support toggling *specific dates*.
            // We will assume for this visual step that we are interacting with "Today's" state mostly or just visual.
            if (dateKey === new Date().toISOString().split('T')[0]) {
                completeHabit(habitId);
            }
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col bg-[#1e202e] rounded-3xl p-4 border min-w-[300px] max-w-[320px] shadow-lg relative overflow-hidden",
                isToday ? "border-teal-500/30 ring-1 ring-teal-500/20" : "border-[#2f334d]"
            )}
            data-component="DayCard"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-zinc-100 font-bold capitalize text-lg">{dayName}</span>
                <span className="text-zinc-500 font-mono text-sm">{dateStr}</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                {habits.map(habit => {
                    const isCompleted = habit.completedDates.includes(dateKey);
                    return (
                        <HabitSquare
                            key={habit.id}
                            habit={habit}
                            isCompleted={isCompleted}
                            onToggle={() => handleToggle(habit.id)}
                        />
                    );
                })}
                {habits.length === 0 && (
                    <div className="col-span-2 text-center text-zinc-600 text-sm py-8">
                        No hay hábitos configurados.
                    </div>
                )}
            </div>

            {/* Footer Progress */}
            <div className="mt-auto" data-component="DayProgress">
                <div className="h-1.5 w-full bg-[#2f334d] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-teal-400 font-bold">{Math.round(progressPercent)}%</span>
                </div>
            </div>
        </div>
    );
}
