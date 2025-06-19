import {
    Events,
    Interaction,
    ChatInputCommandInteraction
} from 'discord.js';
import type {
    ClientWithCommands,
    Command
} from '../types/ClientWithCommands';

export default {
    name: Events.InteractionCreate,
    once: false,

    /**
     * @param interaction L'interaction émise (slash, context menu, buttons…)
     * @param client      Ton client enrichi de client.commands
     */
    async execute(interaction: Interaction, client: ClientWithCommands): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const command: Command | undefined = client.commands.get(commandName);

        if (!command) {
            console.warn(`[WARN] Commande inconnue reçue: ${commandName}`);
            return;
        }

        try {
            await command.execute(interaction as ChatInputCommandInteraction, client);
        } catch (error) {
            console.error(`❌ Erreur lors de l’exécution de /${commandName}`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Une erreur est survenue.', flags: 64 });
            } else {
                await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
            }
        }
    },
} as const;
