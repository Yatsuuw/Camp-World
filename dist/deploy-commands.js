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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const discord_js_1 = require("discord.js");
const commands_1 = __importDefault(require("./commands"));
const handleErrorOptions_1 = require("./functions/logs/handleErrorOptions");
const log_1 = require("./functions/logs/log");
async function main() {
    try {
        const payload = commands_1.default.map((cmd) => {
            try {
                return cmd.data.toJSON();
            }
            catch (error) {
                (0, handleErrorOptions_1.handleError)(error, {
                    source: 'deploy-commands',
                    logMessage: `Erreur lors de la conversion en JSON pour la commande ${cmd?.data?.name ?? "iconnue"}`,
                    includeStack: true,
                });
                throw error;
            }
        });
        if (payload.length === 0) {
            console.warn('⚠️  Aucune commande à déployer.');
            return;
        }
        const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
        const CLIENT_ID = process.env.CLIENT_ID || '';
        if (!DISCORD_TOKEN || !CLIENT_ID) {
            (0, handleErrorOptions_1.handleError)(new Error('TOKEN ou CLIENT_ID non défini dans le fichier .env'), {
                source: 'deploy-commands',
                logMessage: `❌ Variables d'environnement incomplètes.`,
                includeStack: false,
            });
            return;
        }
        const rest = new discord_js_1.REST({ version: '10' }).setToken(DISCORD_TOKEN);
        try {
            (0, log_1.log)('info', `🛰️  Déploiement de ${payload.length} commande(s) slash...`, { source: 'deploy-commands', includeStack: false });
            await rest.put(discord_js_1.Routes.applicationCommands(CLIENT_ID), { body: payload });
            (0, log_1.log)('info', '✅  Commandes déployées avec succès.', { source: 'deploy-commands', includeStack: false });
        }
        catch (error) {
            (0, handleErrorOptions_1.handleError)(error, {
                source: 'deploy-commands',
                logMessage: `❌ Erreur lors de l'appel à l'API de Discord pour déployer les commandes.`,
                includeStack: true,
            });
            return;
        }
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'deploy-commands',
            logMessage: 'Erreur critique dans le processus de déploiement.',
            includeStack: true,
        });
        throw error;
    }
}
main().then(() => process.exit(0)).catch((error) => {
    (0, handleErrorOptions_1.handleError)(error, {
        source: 'deploy-commands',
        logMessage: 'Erreur non interceptée dans le déploiement.',
        includeStack: true,
    });
    process.exit(1);
});
