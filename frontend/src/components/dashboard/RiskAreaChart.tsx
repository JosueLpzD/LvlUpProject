'use client';

import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RiskAreaChartProps {
    depositAmount: number;
    ethPrice: number;
    completed: number;
    total: number;
    isHardMode: boolean;
}

export function RiskAreaChart({ depositAmount, ethPrice, completed, total, isHardMode }: RiskAreaChartProps) {
    const totalValueUSD = depositAmount * ethPrice;

    // Simulación de datos históricos para la gráfica
    // En producción esto vendría de un historial real de "saldo diario"
    const data = [
        { day: 'Lun', value: totalValueUSD },
        { day: 'Mar', value: totalValueUSD * 0.98 },
        { day: 'Mié', value: totalValueUSD * 0.95 },
        { day: 'Jue', value: totalValueUSD * (completed / (total || 1)) }, // Punto actual
        { day: 'Vie', value: totalValueUSD * (completed / (total || 1)) }, // Proyección
        { day: 'Sáb', value: totalValueUSD * (completed / (total || 1)) },
        { day: 'Dom', value: totalValueUSD * (completed / (total || 1)) },
    ];

    const currentLoss = totalValueUSD - (totalValueUSD * (completed / (total || 1)));
    const isLosing = currentLoss > 0;

    return (
        <div className="w-full h-48 bg-black/20 rounded-xl border border-zinc-800/50 p-4 relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
                <h4 className="text-xs font-bold text-zinc-500 uppercase">Proyección de Capital</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-white">
                        ${(totalValueUSD * (completed / (total || 1))).toFixed(2)}
                    </span>
                    {isLosing && (
                        <span className="text-xs font-bold text-red-400 flex items-center bg-red-500/10 px-1.5 py-0.5 rounded">
                            <TrendingDown size={12} className="mr-1" />
                            -${currentLoss.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {isHardMode && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                    <AlertTriangle size={10} />
                    <span>Modo HARD: Cualquier fallo penaliza</span>
                </div>
            )}
        </div>
    );
}
