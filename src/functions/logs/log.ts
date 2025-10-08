import { LogOptions, Logs } from "../../types/logs";
import { writeLogToFile } from "./writeLogToFile";
import { DateTime } from "luxon";
import axios from "axios";

export function log(
    level: Logs,
    message: string | unknown,
    options: LogOptions = {}
): void {
    const { source = 'system', includeStack = false } = options;
    const timestamp: string = DateTime.now().setZone('Europe/Paris').toFormat('yyyy-LL-dd HH:mm:ss');

    let logPayload: Record<string, unknown>;

    if (message instanceof Error) {
        logPayload = {
            name: message.name,
            message: message.message,
            stack: includeStack ? message.stack : undefined,
            raw: message,
        };
        message = message.message;
    } else if (typeof message === 'object' && message !== null) {
        logPayload = {
            ...message,
            stack: includeStack && (message as any).stack ? (message as any).stack: undefined,
            raw: message
        };
        message = (message as any).message ?? JSON.stringify(message);
    } else {
        logPayload = includeStack ? { message, stack: new Error().stack } : { message };
    }

    const formatted = `${timestamp} [${level.toUpperCase()}] [${source}] ${message}`;

    switch (level) {
        case 'info':
            console.log(formatted, logPayload);
            break;
        case 'warn':
            console.warn(formatted, logPayload);
            break;
        case 'error':
            console.error(formatted, logPayload);
            break;
        case 'debug':
            if (process.env.NODE_ENV === 'development') {
                console.debug(formatted, logPayload);
            }
            break;
    }

    writeLogToFile(
        typeof message === 'string' ? message : JSON.stringify(message), {
        level,
        source,
        includeStack,
        stack: includeStack ? (logPayload.stack as string) : undefined,
    });
}

export function extractAniListApiErrorMessage(err: unknown): string | undefined {
    try {
        if (!axios.isAxiosError(err)) return undefined;
        const data: any = err.response?.data;
        if (!data) return undefined;
        if (typeof data === 'string') return data;
        return data?.errors?.[0]?.message ?? data?.message ?? undefined;
    } catch {
        return undefined;
    }
}