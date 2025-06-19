import mariadb, { Pool } from 'mariadb';
import * as dotenv from 'dotenv';

dotenv.config();

export const pool: Pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});