"use client";

import { useEffect, useState } from "react";
import { timeblockService, StatsDTO } from "@/services/timeblockService";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Target } from "lucide-react";

/**
 * ProgressCharts - Panel de gráficas de progreso semanal del usuario.
 * 
 * Muestra 3 métricas visuales:
 * 1. Barras de actividad diaria (últimos 7 días)
 * 2. Dona/anillo de tasa de cumplimiento semanal
 * 3. Racha actual de días consecutivos productivos
 * 
 * Los datos vienen de /timeblocks/stats (backend → MongoDB)
 */
export function ProgressCharts() {
    // Estado para guardar las estadísticas del backend
    const [stats, setStats] = useState<StatsDTO | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar estadísticas al montar el componente
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await timeblockService.getStats();
                setStats(data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Mientras carga, mostrar skeleton
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#1e202e] rounded-3xl border border-zinc-800 p-6 h-48 animate-pulse" />
                ))}
            </div>
        );
    }

    // Si no hay datos, no mostrar nada
    if (!stats) return null;

    // Calcular la altura máxima para las barras
    const maxBlocks = Math.max(...stats.daily.map(d => d.total), 1);

    // Nombres cortos de los días en español
    const dayNames = stats.daily.map(d => {
        const date = new Date(d.date + "T12:00:00"); // Evitar problemas de timezone
        return date.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3);
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ============================================ */}
            {/* GRÁFICA 1: Barras de Actividad Diaria        */}
            {/* ============================================ */}
            <div className="md:col-span-2 bg-[#1e202e] rounded-3xl border border-zinc-800 p-5 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <TrendingUp size={16} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Actividad Diaria
                    </span>
                </div>

                {/* Barras SVG */}
                <div className="flex-1 flex items-end gap-2 min-h-[120px]">
                    {stats.daily.map((day, i) => {
                        // Altura proporcional al máximo (en porcentaje)
                        const totalHeight = maxBlocks > 0 ? (day.total / maxBlocks) * 100 : 0;
                        const completedHeight = maxBlocks > 0 ? (day.completed / maxBlocks) * 100 : 0;
                        const isToday = i === stats.daily.length - 1;

                        return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                {/* Contador encima de la barra */}
                                <span className={`text-[10px] font-bold ${day.completed > 0 ? "text-teal-400" : "text-zinc-600"
                                    }`}>
                                    {day.completed}/{day.total}
                                </span>

                                {/* Contenedor de la barra */}
                                <div className="w-full relative h-[100px] flex items-end">
                                    {/* Barra de fondo (total planeado) */}
                                    <motion.div
                                        className="w-full rounded-t-lg bg-zinc-800/60 absolute bottom-0"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${totalHeight}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.08 }}
                                    />
                                    {/* Barra de completados (encima) */}
                                    <motion.div
                                        className={`w-full rounded-t-lg absolute bottom-0 ${isToday
                                                ? "bg-gradient-to-t from-teal-500 to-teal-400"
                                                : "bg-gradient-to-t from-violet-600 to-violet-400"
                                            }`}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${completedHeight}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.08 + 0.2 }}
                                    />
                                </div>

                                {/* Nombre del día */}
                                <span className={`text-[10px] font-semibold capitalize ${isToday ? "text-teal-400" : "text-zinc-500"
                                    }`}>
                                    {dayNames[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Leyenda */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                        <span className="text-[10px] text-zinc-500">Completados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-zinc-700" />
                        <span className="text-[10px] text-zinc-500">Planeados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                        <span className="text-[10px] text-zinc-500">Hoy</span>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* PANEL DERECHO: Dona + Racha                  */}
            {/* ============================================ */}
            <div className="flex flex-col gap-4">
                {/* GRÁFICA 2: Dona de Cumplimiento */}
                <div className="bg-[#1e202e] rounded-3xl border border-zinc-800 p-5 flex flex-col items-center flex-1">
                    <div className="flex items-center gap-2 mb-3 self-start">
                        <div className="p-1.5 rounded-lg bg-teal-500/10">
                            <Target size={16} className="text-teal-400" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Cumplimiento
                        </span>
                    </div>

                    {/* SVG Dona/Anillo */}
                    <div className="relative w-28 h-28">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {/* Anillo de fondo */}
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="#2f334d"
                                strokeWidth="10"
                            />
                            {/* Anillo de progreso */}
                            <motion.circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="url(#donaGradient)"
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                animate={{
                                    strokeDashoffset: 2 * Math.PI * 40 * (1 - stats.completion_rate / 100)
                                }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                            {/* Gradiente para el anillo */}
                            <defs>
                                <linearGradient id="donaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#14b8a6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Porcentaje centrado */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                className="text-2xl font-black text-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {stats.completion_rate}%
                            </motion.span>
                        </div>
                    </div>

                    {/* Detalle */}
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-zinc-500">
                            {stats.weekly_completed}/{stats.weekly_total} bloques esta semana
                        </span>
                    </div>
                </div>

                {/* GRÁFICA 3: Racha Actual */}
                <div className="bg-[#1e202e] rounded-3xl border border-zinc-800 p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10">
                        <Flame size={24} className="text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                        <motion.span
                            className="text-3xl font-black text-white leading-none"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.6 }}
                        >
                            {stats.current_streak}
                        </motion.span>
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                            {stats.current_streak === 1 ? "Día de racha" : "Días de racha"}
                        </span>
                    </div>
                    {/* Indicador visual de fuego por cada día */}
                    <div className="ml-auto flex gap-0.5">
                        {Array.from({ length: Math.min(stats.current_streak, 7) }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="text-amber-500"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                            >
                                🔥
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
