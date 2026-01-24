"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { motion } from "framer-motion";
import { Coins, ShoppingBag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_REWARDS = [
    { id: '1', title: 'Día Libre (Cheat Day)', cost: 500, emoji: '🍔' },
    { id: '2', title: 'Noche de Cine', cost: 1000, emoji: '🎬' },
    { id: '3', title: 'Videojuego Nuevo', cost: 5000, emoji: '🎮' },
    { id: '4', title: 'Viaje de Fin de Semana', cost: 20000, emoji: '✈️' },
];

export function LootShop() {
    const { user, buyReward } = useGameStore();

    const handleBuy = (cost: number) => {
        if (user.stats.gold >= cost) {
            // Trigger buy action (needs to be implemented in store fully)
            alert("¡Compra realizada! (Simulación)");
        } else {
            alert("No tienes suficiente oro.");
        }
    };

    return (
        <div className="space-y-6" data-component="LootShop">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl text-yellow-500"><ShoppingBag /></span> Mercado Negro
                </h2>
                <div className="flex items-center gap-2 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-700/50">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="text-yellow-400 font-mono font-bold">{user.stats.gold}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {DEMO_REWARDS.map((item) => {
                    const canAfford = user.stats.gold >= item.cost;
                    return (
                        <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                                "bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group",
                                !canAfford && "opacity-60 grayscale"
                            )}
                            data-component="RewardCard"
                        >
                            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">{item.emoji}</div>
                            <div>
                                <div className="font-bold text-zinc-200 leading-tight">{item.title}</div>
                                <div className={cn("text-xs font-bold mt-1", canAfford ? "text-yellow-500" : "text-red-500")}>
                                    {item.cost} Oro
                                </div>
                            </div>

                            <button
                                onClick={() => handleBuy(item.cost)}
                                disabled={!canAfford}
                                className={cn(
                                    "mt-auto w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                                    canAfford
                                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                )}
                            >
                                {canAfford ? "Comprar" : "Bloqueado"}
                            </button>

                            {!canAfford && <div className="absolute top-2 right-2 text-zinc-600"><Lock size={14} /></div>}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
