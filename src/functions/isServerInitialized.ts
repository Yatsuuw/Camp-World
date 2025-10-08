import { pool } from "../utils/database/database";
import { handleError } from "./logs/handleErrorOptions";

export async function isServerInitialized(serverId: string): Promise<boolean> {
    try {
        const rows: any[] = await pool.query(
            'SELECT * FROM servers WHERE id = ?',
            [serverId]
        );
        return rows.length > 0;
    } catch (error: unknown) {
        handleError(error, {
            source: 'isServerInitialized',
            logMessage: `Erreur lors de la vérification d'initialisation (serverId=${serverId})`,
            includeStack: true
        });
        throw error;
    }
}
