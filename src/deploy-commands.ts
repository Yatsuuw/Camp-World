import * as dotenv from 'dotenv';
dotenv.config();

import {
    REST,
    Routes,
    SlashCommandBuilder
} from 'discord.js';
import commands from './commands';
import { Command } from "./types/ClientWithCommands";
import { handleError } from "./functions/logs/handleErrorOptions";
import { log } from "./functions/logs/log";

async function main(): Promise<void> {
    try {
        const payload = commands.map((cmd: Command) => {
            try {
                return (cmd.data as SlashCommandBuilder).toJSON();
            } catch (error: unknown) {
                handleError(error, {
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

        const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN || '';
        const CLIENT_ID: string = process.env.CLIENT_ID || '';

        if (!DISCORD_TOKEN || !CLIENT_ID) {
            handleError(new Error('TOKEN ou CLIENT_ID non défini dans le fichier .env'), {
                source: 'deploy-commands',
                logMessage: `❌ Variables d'environnement incomplètes.`,
                includeStack: false,
            });
            return;
        }

        const rest: REST = new REST({version: '10'}).setToken(DISCORD_TOKEN);

        try {
            log('info', `🛰️  Déploiement de ${payload.length} commande(s) slash...`, { source: 'deploy-commands', includeStack: false })
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: payload }
            );
            log('info', '✅  Commandes déployées avec succès.', { source: 'deploy-commands', includeStack: false })
        } catch (error: unknown) {
            handleError(error, {
                source: 'deploy-commands',
                logMessage: `❌ Erreur lors de l'appel à l'API de Discord pour déployer les commandes.`,
                includeStack: true,
            });
            return;
        }
    } catch (error: unknown) {
        handleError(error, {
            source: 'deploy-commands',
            logMessage: 'Erreur critique dans le processus de déploiement.',
            includeStack: true,
        });
        throw error;
    }
}

main().then((): never => process.exit(0)).catch((error: unknown): never => {
    handleError(error, {
        source: 'deploy-commands',
        logMessage: 'Erreur non interceptée dans le déploiement.',
        includeStack: true,
    });
    process.exit(1);
});
