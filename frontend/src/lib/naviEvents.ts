/**
 * Sistema de eventos para comunicar acciones del TimeBlockPlanner con NaviFairy.
 * Permite que Navi reaccione automáticamente cuando el usuario:
 * - Agrega un hábito al calendario
 * - Borra un hábito del calendario
 * - Expande o reduce la duración de un hábito
 * - Completa un hábito
 */

// Tipos de eventos que Navi puede escuchar
export type NaviEventType =
    | 'habit-added'      // Usuario agregó un bloque al calendario
    | 'habit-removed'    // Usuario eliminó un bloque
    | 'habit-expanded'   // Usuario expandió la duración
    | 'habit-reduced'    // Usuario redujo la duración
    | 'habit-completed'  // Usuario completó un hábito
    | 'config-changed';  // Usuario cambió la configuración de horario

// Datos del evento con contexto para generar respuestas más inteligentes
export interface NaviEventData {
    type: NaviEventType;
    habitName?: string;
    habitEmoji?: string;
    durationChange?: number; // +15 o -15 minutos
    totalDuration?: number;  // Duración total actual
    startHour?: number;      // Hora de inicio del planificador
    endHour?: number;        // Hora de fin del planificador
}

// Callbacks suscritos al sistema de eventos
type NaviEventCallback = (event: NaviEventData) => void;
const listeners: NaviEventCallback[] = [];

/**
 * Emite un evento para que Navi reaccione.
 * Se llama desde TimeBlockPlanner cuando ocurre una acción relevante.
 * 
 * @example
 * // Cuando el usuario agrega un bloque:
 * emitNaviEvent({ type: 'habit-added', habitName: 'Lectura', habitEmoji: '📚' });
 */
export const emitNaviEvent = (data: NaviEventData): void => {
    // Notificar a todos los listeners (NaviFairy)
    listeners.forEach(callback => {
        try {
            callback(data);
        } catch (error) {
            console.error('Error en listener de NaviEvent:', error);
        }
    });
};

/**
 * Suscribe un callback para escuchar eventos de Navi.
 * Retorna una función para desuscribirse.
 * 
 * @example
 * // En NaviFairy.tsx:
 * useEffect(() => {
 *     const unsubscribe = subscribeToNaviEvents((event) => {
 *         // Reaccionar al evento
 *     });
 *     return unsubscribe;
 * }, []);
 */
export const subscribeToNaviEvents = (callback: NaviEventCallback): (() => void) => {
    listeners.push(callback);

    // Retornar función para desuscribirse
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
};

/**
 * Genera un mensaje contextual para el evento (para usar con la API de Navi).
 * Esto crea el prompt que se enviará a Gemini.
 */
export const getNaviPromptForEvent = (event: NaviEventData): string => {
    switch (event.type) {
        case 'habit-added':
            return `El usuario acaba de agregar "${event.habitName}" ${event.habitEmoji || ''} a su calendario. Felicítalo brevemente y motívalo.`;

        case 'habit-removed':
            return `El usuario eliminó "${event.habitName || 'una actividad'}" de su calendario. Sé empático pero anímalo a seguir adelante.`;

        case 'habit-expanded':
            return `El usuario decidió dedicar más tiempo a "${event.habitName || 'su actividad'}" (+${event.durationChange} min). ¡Celebra su compromiso!`;

        case 'habit-reduced':
            return `El usuario redujo el tiempo de "${event.habitName || 'su actividad'}" (${event.durationChange} min). Anímalo, a veces es necesario ajustar.`;

        case 'habit-completed':
            return `¡El usuario completó "${event.habitName}" ${event.habitEmoji || ''}! ¡Celébralo mucho!`;

        case 'config-changed':
            const hours = (event.endHour || 21) - (event.startHour || 5);
            return `El usuario ajustó su horario de productividad: ahora trabaja de las ${event.startHour}:00 a las ${event.endHour}:00 (${hours} horas). Felicítalo por organizar su día.`;

        default:
            return 'El usuario está trabajando en su productividad. Dile algo motivador.';
    }
};
