import mariadb, { Pool, PoolConnection } from 'mariadb';
import * as dotenv from 'dotenv';
import { handleError } from "../../functions/logs/handleErrorOptions";

dotenv.config();

export const pool: Pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

export async function getConnection(): Promise<PoolConnection> {
    return await pool.getConnection();
}

export async function testDatabaseConnection(): Promise<boolean> {
    let conn: PoolConnection | undefined;

    try {
        conn = await getConnection();
        await conn.query('SELECT 1');
        return true;
    } catch (error: unknown) {
        handleError(error, {
            source: 'database',
            logMessage: 'Échec de la connexion au pool MariaDB.',
            includeStack: true,
        });
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.release();
            } catch (releaseError: unknown) {
                handleError(releaseError, {
                    source: 'database',
                    logMessage: 'Impossible de libérer la connexion MariaDB.',
                    includeStack: true,
                });
            }
        }
    }
}