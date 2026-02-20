"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { QuestCard } from "./QuestCard";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

export function ActiveQuestBoard() {
    const { habits } = useGameStore();
    const { address } = useAccount();
    const [weekId, setWeekId] = useState(1);
    const [config, setConfig] = useState<any>(null);

    const activeHabits = habits; // Can filter by 'isDaily' or 'active' later

    // Sync weekId from localStorage (Test Mode)
    useEffect(() => {
        const syncWeek = () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('lvlup_test_week_id');
                if (saved) setWeekId(parseInt(saved));
            }
        };
        syncWeek();
        window.addEventListener('weekIdChanged', syncWeek);
        return () => window.removeEventListener('weekIdChanged', syncWeek);
    }, []);

    // Fetch Config for current week/user
    const fetchConfig = async () => {
        if (!address) return;
        try {
            const res = await fetch(`http://localhost:8000/finance/config/${address}/${weekId}`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error("Error fetching config", e);
        }
    };

    useEffect(() => {
        fetchConfig();
        // Listen for updates from CommitmentCard (deposit success)
        window.addEventListener('weekConfigUpdated', fetchConfig);
        return () => window.removeEventListener('weekConfigUpdated', fetchConfig);
    }, [address, weekId]);

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
                    activeHabits.map((habit, index) => {
                        // Check if this habit is protected by contract
                        const isProtected = config?.active && (
                            config?.mode === 'HARD' ||
                            config?.selected_habit_ids?.includes(habit.id)
                        );
                        const contractInfo = isProtected ? {
                            active: true,
                            txHash: config?.tx_hash,
                            amount: config?.deposit_amount,
                            mode: config?.mode,
                            status: config?.status,
                            settlementTxHash: config?.settlement_tx_hash,
                            amountReturned: config?.amount_returned
                        } : undefined;

                        return (
                            <motion.div
                                key={habit.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <QuestCard habit={habit} contractInfo={contractInfo} />
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
