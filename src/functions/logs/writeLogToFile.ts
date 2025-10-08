import { DateTime } from 'luxon';
import path from "path";
import * as fs from "node:fs";
import { handleError } from "./handleErrorOptions";

export interface WriteLogOptions {
    level?: 'info' | 'warn' | 'error' | 'debug';
    source?: string;
    includeStack?: boolean;
    stack?: string;
}

const logsDir: string = path.resolve(process.cwd(), 'logs');
let currentLogDate: string = DateTime.now().setZone('Europe/Paris').toFormat('yyyy-LL-dd');

function ensureLogFileForToday(): string {
    try {
        const now: DateTime<true> | DateTime<false> = DateTime.now().setZone('Europe/Paris');
        const dateStr: string = now.toFormat('yyyy-LL-dd');

        if (dateStr !== currentLogDate) {
            currentLogDate = dateStr;
        }

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const logFilePath: string = path.join(logsDir, `${currentLogDate}.log`);
        if (!fs.existsSync(logFilePath)) {
            const header = `==== Logs du ${dateStr} ====\n`;
            fs.writeFileSync(logFilePath, header, { encoding: 'utf8' });
        }

        return logFilePath;
    } catch (error: unknown) {
        handleError(error, {
            source: 'writeLogToFile',
            logMessage: '❌ Impossible de créer le fichier de log du jour.',
            includeStack: true,
        });
        throw error;
    }
}

function scheduleLogRotation(): void {
    const now: DateTime<true> | DateTime<false> = DateTime.now().setZone('Europe/Paris');
    const tomorrowMidnight: DateTime<true> | DateTime<false> = now.plus({ days: 1 }).startOf('day');
    const delay: number = tomorrowMidnight.toMillis() - now.toMillis();

    setTimeout((): void => {
        ensureLogFileForToday();
        scheduleLogRotation();
    }, delay)
}

ensureLogFileForToday();
scheduleLogRotation();

export function writeLogToFile(message: string, options: WriteLogOptions = {}): void {
    try {
        const { level = 'info', source = 'system', includeStack = false, stack } = options;

        const now: DateTime<true> | DateTime<false> = DateTime.now().setZone('Europe/Paris');
        const timeStr: string = now.toFormat('HH:mm:ss');

        const logFilePath: string = ensureLogFileForToday();

        const logLine: string = `[${timeStr}] [${level.toUpperCase()}] [${source}] ${message}` + (includeStack && stack ? `\nStack:\n${stack}` : '') + '\n';

        fs.appendFileSync(logFilePath, logLine, { encoding: 'utf8' });
    } catch (error: unknown) {
        handleError(error, {
            source: 'writeLogToFile',
            logMessage: `❌ Impossible d'écrire le log dans le fichier.`,
            includeStack: true,
        });
        throw error;
    }
}
