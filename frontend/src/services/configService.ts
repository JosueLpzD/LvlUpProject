/**
 * Servicio para la configuración del usuario.
 * Permite guardar y cargar preferencias como el horario del planificador.
 */

// Usa la variable de entorno para conectar con el backend (local o Cloudflare)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Tipo para la configuración del usuario
export interface UserConfig {
    start_hour: number;
    end_hour: number;
}

/**
 * Obtiene la configuración del usuario desde el servidor.
 * Si no existe configuración, retorna valores por defecto.
 */
export async function getConfig(): Promise<UserConfig> {
    const response = await fetch(`${API_BASE}/config`);

    if (!response.ok) {
        console.error("Failed to fetch config, using defaults");
        return { start_hour: 5, end_hour: 21 };
    }

    return response.json();
}

/**
 * Guarda la configuración del usuario en el servidor.
 */
export async function saveConfig(config: UserConfig): Promise<void> {
    const response = await fetch(`${API_BASE}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        throw new Error("Failed to save config");
    }
}

// Exportar como objeto de servicio
export const configService = {
    get: getConfig,
    save: saveConfig,
};
