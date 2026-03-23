"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLogToFile = writeLogToFile;
const luxon_1 = require("luxon");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("node:fs"));
const handleErrorOptions_1 = require("./handleErrorOptions");
const logsDir = path_1.default.resolve(process.cwd(), 'logs');
let currentLogDate = luxon_1.DateTime.now().setZone('Europe/Paris').toFormat('yyyy-LL-dd');
function ensureLogFileForToday() {
    try {
        const now = luxon_1.DateTime.now().setZone('Europe/Paris');
        const dateStr = now.toFormat('yyyy-LL-dd');
        if (dateStr !== currentLogDate) {
            currentLogDate = dateStr;
        }
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFilePath = path_1.default.join(logsDir, `${currentLogDate}.log`);
        if (!fs.existsSync(logFilePath)) {
            const header = `==== Logs du ${dateStr} ====\n`;
            fs.writeFileSync(logFilePath, header, { encoding: 'utf8' });
        }
        return logFilePath;
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'writeLogToFile',
            logMessage: '❌ Impossible de créer le fichier de log du jour.',
            includeStack: true,
        });
        throw error;
    }
}
function scheduleLogRotation() {
    const now = luxon_1.DateTime.now().setZone('Europe/Paris');
    const tomorrowMidnight = now.plus({ days: 1 }).startOf('day');
    const delay = tomorrowMidnight.toMillis() - now.toMillis();
    setTimeout(() => {
        ensureLogFileForToday();
        scheduleLogRotation();
    }, delay);
}
ensureLogFileForToday();
scheduleLogRotation();
function writeLogToFile(message, options = {}) {
    try {
        const { level = 'info', source = 'system', includeStack = false, stack } = options;
        const now = luxon_1.DateTime.now().setZone('Europe/Paris');
        const timeStr = now.toFormat('HH:mm:ss');
        const logFilePath = ensureLogFileForToday();
        const logLine = `[${timeStr}] [${level.toUpperCase()}] [${source}] ${message}` + (includeStack && stack ? `\nStack:\n${stack}` : '') + '\n';
        fs.appendFileSync(logFilePath, logLine, { encoding: 'utf8' });
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'writeLogToFile',
            logMessage: `❌ Impossible d'écrire le log dans le fichier.`,
            includeStack: true,
        });
        throw error;
    }
}
