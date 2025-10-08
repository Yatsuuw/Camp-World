import {
    Client,
    GatewayIntentBits,
    Collection,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { ClientWithCommands } from './types/ClientWithCommands';
import commands from './commands';
import { testDatabaseConnection } from "./utils/database/database";
import { handleError } from "./functions/logs/handleErrorOptions";
import { loadEvents } from "./utils/loadEvents";
import { log } from "./functions/logs/log";

dotenv.config();
const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN!;

export const client = new Client({
    intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;

client.commands = new Collection();

for (const command of commands) {
    if (!command || !command.data) {
        log('warn',`❌ Commande invalide ignorée : ${command}`, { source: 'index', includeStack: true });
        continue;
    }

    client.commands.set(command.data.name, command);
}

loadEvents(client);

process.on('unhandledRejection', (reason: unknown): void => {
    handleError(reason, {
        source: 'process',
        logMessage: 'Promesse rejetée sans catch détectée.',
        includeStack: true
    });
});

process.on('uncaughtException', (error: unknown): void => {
    handleError(error, {
        source: 'process',
        logMessage: 'Exception non interceptée détectée.',
        includeStack: true,
    });
    process.exit(1);
});

(async (): Promise<void> => {
    try {
        const dbOk: boolean = await testDatabaseConnection();
        if (!dbOk) {
            log('error', '❌ Impossible de démarrer le robot sans la base de données.', {
                source: 'index',
                includeStack: true
            });
            process.exit(1);
        } else {
            log('info', '✅ Connexion à la base de données réussie.', {source: 'index', includeStack: false});
        }

        await client.login(DISCORD_TOKEN);
    } catch (error: unknown) {
        handleError(error, {
            source: 'index',
            logMessage: 'Erreur critique au démarrage du robot.',
            includeStack: true,
        });
        process.exit(1);
    }
})();
