// Usa la variable de entorno para conectar con el backend (local o Cloudflare)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TimeBlockDTO {
    id?: string;
    title: string;
    habit_id: string;
    start_time: string;
    end_time: string;
    completed: boolean;
    date: string; // Formato ISO: "2026-02-05"
}

// Helper to convert time format (8:30 -> "08:30")
const formatTime = (hour: number, min: number): string => {
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
};

export const timeblockService = {
    async getAll(): Promise<TimeBlockDTO[]> {
        const response = await fetch(`${API_URL}/timeblocks`);
        if (!response.ok) throw new Error("Failed to fetch blocks");
        return response.json();
    },

    async getByDate(date: string): Promise<TimeBlockDTO[]> {
        // date formato: "2026-02-05" (ISO 8601)
        const response = await fetch(`${API_URL}/timeblocks?date=${date}`);
        if (!response.ok) throw new Error("Failed to fetch blocks for date");
        return response.json();
    },

    async create(block: { habitId: string, title?: string, startHour: number, startMin: number, durationMin: number }): Promise<TimeBlockDTO> {
        // Calcular end_time
        const startTotal = block.startHour * 60 + block.startMin;
        const endTotal = startTotal + block.durationMin;
        const endHour = Math.floor(endTotal / 60);
        const endMin = endTotal % 60;

        const payload = {
            title: block.title || "Actividad",
            habit_id: block.habitId,
            start_time: formatTime(block.startHour, block.startMin),
            end_time: formatTime(endHour, endMin),
            completed: false,
            date: new Date().toISOString().split('T')[0] // "2026-02-05"
        };

        const response = await fetch(`${API_URL}/timeblocks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to create block");
        const result = await response.json(); // { id: "...", message: "..." }

        return {
            ...payload,
            id: result.id
        };
    },

    // Future expansion: update status
    // Future expansion: update status
    async updateStatus(id: string, completed: boolean): Promise<void> {
        // FastAPI expects simple types as query params by default
        const response = await fetch(`${API_URL}/timeblocks/${id}?completed=${completed}`, {
            method: "PUT"
        });

        if (!response.ok) throw new Error("Failed to update status");
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/timeblocks/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete block");
    },

    /**
     * Actualiza la duración de un bloque (start_time y end_time).
     * Se usa cuando el usuario expande/reduce un bloque con los botones +/-.
     */
    async updateDuration(id: string, startHour: number, startMin: number, durationMin: number): Promise<void> {
        // Calcular start_time
        const startTime = formatTime(startHour, startMin);

        // Calcular end_time
        const startTotal = startHour * 60 + startMin;
        const endTotal = startTotal + durationMin;
        const endHour = Math.floor(endTotal / 60);
        const endMin = endTotal % 60;
        const endTime = formatTime(endHour, endMin);

        const response = await fetch(
            `${API_URL}/timeblocks/${id}/duration?start_time=${startTime}&end_time=${endTime}`,
            { method: "PUT" }
        );

        if (!response.ok) throw new Error("Failed to update duration");
    },

    /**
     * Obtiene estadísticas de los últimos 7 días para las gráficas de progreso.
     */
    async getStats(): Promise<StatsDTO> {
        const response = await fetch(`${API_URL}/timeblocks/stats`);
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
    }
};

// Tipo para las estadísticas semanales devueltas por /timeblocks/stats
export interface StatsDTO {
    daily: { date: string; total: number; completed: number }[];
    weekly_total: number;
    weekly_completed: number;
    completion_rate: number;
    current_streak: number;
}
