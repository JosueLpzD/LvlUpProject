export type AttributeType = 'strength' | 'intellect' | 'spirit' | 'vitality';

export interface LevelData {
    level: number;
    title: string;
    minXP: number;
}

export interface UserStats {
    level: number;
    totalXP: number;
    gold: number;
    attributes: Record<AttributeType, number>;
}

export interface Habit {
    id: string;
    title: string;
    description?: string;
    attribute: AttributeType;
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    xpValue: number;
    completedDates: string[]; // ISO date strings
    streak: number;
    isDaily: boolean;
}

export interface Reward {
    id: string;
    title: string;
    cost: number;
    emoji: string;
    purchased: boolean;
}

export interface User {
    name: string;
    avatar?: string;
    stats: UserStats;
}

export interface GameState {
    user: User;
    habits: Habit[];
    rewards: Reward[];
    history: {
        date: string;
        xpGained: number;
        habitsCompleted: string[];
    }[];
}

export const ATTRIBUTE_COLORS: Record<AttributeType, string> = {
    strength: 'bg-red-500',
    intellect: 'bg-blue-500',
    spirit: 'bg-purple-500',
    vitality: 'bg-green-500',
};

export const LEVEL_THRESHOLDS = [
    { level: 1, minXP: 0, title: 'Novato' },
    { level: 2, minXP: 500, title: 'Aprendiz' },
    { level: 3, minXP: 1500, title: 'Iniciado' },
    { level: 4, minXP: 3000, title: 'Adepto' },
    { level: 5, minXP: 5000, title: 'Experto' },
    { level: 6, minXP: 8000, title: 'Maestro' },
    { level: 7, minXP: 12000, title: 'Gran Maestro' },
    { level: 8, minXP: 17000, title: 'Leyenda' },
    { level: 9, minXP: 23000, title: 'Mítico' },
    { level: 10, minXP: 30000, title: 'Divino' },
];
