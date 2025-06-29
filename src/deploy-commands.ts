import * as dotenv from 'dotenv';
dotenv.config();

import { REST, Routes, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction } from 'discord.js';
import commands from './commands';
import {ClientWithCommands} from "./types/ClientWithCommands";

async function main(): Promise<void> {
    const payload = commands
        .filter(
            (cmd: {
                data?: SlashCommandOptionsOnlyBuilder;
                execute?: (interaction: ChatInputCommandInteraction, Client: ClientWithCommands) => Promise<void>;
            }): boolean | undefined => cmd?.data && typeof cmd.data.toJSON === 'function'
        )
        .map((cmd: { data: SlashCommandOptionsOnlyBuilder; execute(interaction: ChatInputCommandInteraction, Client: ClientWithCommands): Promise<void> }) => cmd.data.toJSON());

    if (payload.length === 0) {
        console.warn('⚠️  Aucune commande à déployer.');
        return;
    }

    const TOKEN: string = process.env.DISCORD_TOKEN || '';
    const CLIENT_ID: string = process.env.CLIENT_ID || '';

    if (!TOKEN || !CLIENT_ID) {
        console.error('❌ TOKEN ou CLIENT_ID non défini dans le fichier .env');
        return;
    }

    const rest: REST = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log(`🛰️  Déploiement de ${payload.length} commande(s) slash...`);
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: payload }
        );
        console.log('✅  Commandes déployées avec succès.');
    } catch (error) {
        console.error('❌  Erreur lors du déploiement des commandes :', error);
    }
}

main().then((): never => process.exit(0)).catch((err: any): never => {
    console.error(err);
    process.exit(1);
});
