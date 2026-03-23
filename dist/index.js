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
exports.client = void 0;
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const commands_1 = __importDefault(require("./commands"));
const database_1 = require("./utils/database/database");
const handleErrorOptions_1 = require("./functions/logs/handleErrorOptions");
const loadEvents_1 = require("./utils/loadEvents");
const log_1 = require("./functions/logs/log");
dotenv.config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
exports.client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds],
});
exports.client.commands = new discord_js_1.Collection();
for (const command of commands_1.default) {
    if (!command || !command.data) {
        (0, log_1.log)('warn', `❌ Commande invalide ignorée : ${command}`, { source: 'index', includeStack: true });
        continue;
    }
    exports.client.commands.set(command.data.name, command);
}
(0, loadEvents_1.loadEvents)(exports.client);
process.on('unhandledRejection', (reason) => {
    (0, handleErrorOptions_1.handleError)(reason, {
        source: 'process',
        logMessage: 'Promesse rejetée sans catch détectée.',
        includeStack: true
    });
});
process.on('uncaughtException', (error) => {
    (0, handleErrorOptions_1.handleError)(error, {
        source: 'process',
        logMessage: 'Exception non interceptée détectée.',
        includeStack: true,
    });
    process.exit(1);
});
(async () => {
    try {
        const dbOk = await (0, database_1.testDatabaseConnection)();
        if (!dbOk) {
            (0, log_1.log)('error', '❌ Impossible de démarrer le robot sans la base de données.', {
                source: 'index',
                includeStack: true
            });
            process.exit(1);
        }
        else {
            (0, log_1.log)('info', '✅ Connexion à la base de données réussie.', { source: 'index', includeStack: false });
        }
        await exports.client.login(DISCORD_TOKEN);
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'index',
            logMessage: 'Erreur critique au démarrage du robot.',
            includeStack: true,
        });
        process.exit(1);
    }
})();
