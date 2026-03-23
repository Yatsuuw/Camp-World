"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.extractAniListApiErrorMessage = extractAniListApiErrorMessage;
const writeLogToFile_1 = require("./writeLogToFile");
const luxon_1 = require("luxon");
const axios_1 = __importDefault(require("axios"));
function log(level, message, options = {}) {
    const { source = 'system', includeStack = false } = options;
    const timestamp = luxon_1.DateTime.now().setZone('Europe/Paris').toFormat('yyyy-LL-dd HH:mm:ss');
    let logPayload;
    if (message instanceof Error) {
        logPayload = {
            name: message.name,
            message: message.message,
            stack: includeStack ? message.stack : undefined,
            raw: message,
        };
        message = message.message;
    }
    else if (typeof message === 'object' && message !== null) {
        logPayload = {
            ...message,
            stack: includeStack && message.stack ? message.stack : undefined,
            raw: message
        };
        message = message.message ?? JSON.stringify(message);
    }
    else {
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
    (0, writeLogToFile_1.writeLogToFile)(typeof message === 'string' ? message : JSON.stringify(message), {
        level,
        source,
        includeStack,
        stack: includeStack ? logPayload.stack : undefined,
    });
}
function extractAniListApiErrorMessage(err) {
    try {
        if (!axios_1.default.isAxiosError(err))
            return undefined;
        const data = err.response?.data;
        if (!data)
            return undefined;
        if (typeof data === 'string')
            return data;
        return data?.errors?.[0]?.message ?? data?.message ?? undefined;
    }
    catch {
        return undefined;
    }
}
