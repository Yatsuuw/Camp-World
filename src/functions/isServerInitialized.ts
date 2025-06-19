import { pool } from "../utils/database";
import { PoolConnection } from "mariadb";

export async function isServerInitialized(serverId: string): Promise<boolean> {
    const conn: PoolConnection = await pool.getConnection();
    try {
        const rows: any = await conn.query(
            'SELECT * FROM servers WHERE id = ?',
            [serverId]
        );
        return rows.length > 0;
    } finally {
        await conn.release();
    }
}
