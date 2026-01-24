import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Habit, UserStats, User, LEVEL_THRESHOLDS } from '../gamification/types';

interface GameActions {
    addXP: (amount: number, attribute: keyof UserStats['attributes']) => void;
    completeHabit: (habitId: string) => void;
    addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak'>) => void;
    buyReward: (rewardId: string) => void;
    resetProgress: () => void;
}

const INITIAL_STATE: GameState = {
    user: {
        name: 'Jugador',
        stats: {
            level: 1,
            totalXP: 0,
            gold: 0,
            attributes: {
                strength: 0,
                intellect: 0,
                spirit: 0,
                vitality: 0,
            },
        },
    },
    habits: [
        {
            id: '1',
            title: 'Lectura Profunda',
            attribute: 'intellect',
            difficulty: 'medium',
            xpValue: 50,
            completedDates: [],
            streak: 0,
            isDaily: true
        },
        {
            id: '2',
            title: 'Entrenamiento Pesado',
            attribute: 'strength',
            difficulty: 'hard',
            xpValue: 100,
            completedDates: [],
            streak: 0,
            isDaily: true
        }
    ],
    rewards: [],
    history: [],
};

export const useGameStore = create<GameState & GameActions>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,

            addXP: (amount, attribute) => {
                set((state) => {
                    const newTotalXP = state.user.stats.totalXP + amount;
                    const newAttributeXP = state.user.stats.attributes[attribute] + amount;

                    // Check for level up
                    let newLevel = state.user.stats.level;
                    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
                        if (newTotalXP >= LEVEL_THRESHOLDS[i].minXP) {
                            newLevel = LEVEL_THRESHOLDS[i].level;
                            break;
                        }
                    }

                    return {
                        user: {
                            ...state.user,
                            stats: {
                                ...state.user.stats,
                                totalXP: newTotalXP,
                                level: newLevel,
                                gold: state.user.stats.gold + Math.floor(amount * 0.5), // 1 XP = 0.5 Gold
                                attributes: {
                                    ...state.user.stats.attributes,
                                    [attribute]: newAttributeXP
                                }
                            },
                        },
                    };
                });
            },

            completeHabit: (habitId) => {
                const today = new Date().toISOString().split('T')[0];
                const state = get();
                const habit = state.habits.find((h) => h.id === habitId);

                if (!habit) return;
                if (habit.completedDates.includes(today)) return; // Already completed today

                // Update Habit Streak
                set((state) => ({
                    habits: state.habits.map((h) => {
                        if (h.id === habitId) {
                            return {
                                ...h,
                                completedDates: [...h.completedDates, today],
                                streak: h.streak + 1
                            }
                        }
                        return h;
                    })
                }));

                // Add XP
                get().addXP(habit.xpValue, habit.attribute);
            },

            addHabit: (habitData) => {
                const newHabit: Habit = {
                    ...habitData,
                    id: crypto.randomUUID(),
                    completedDates: [],
                    streak: 0
                };
                set(state => ({ habits: [...state.habits, newHabit] }));
            },

            buyReward: (rewardId) => {
                // TODO: Implement shop logic
            },

            resetProgress: () => set(INITIAL_STATE),
        }),
        {
            name: 'lvlup-storage',
        }
    )
);
