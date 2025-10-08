import {
    Events,
    Interaction,
    ChatInputCommandInteraction
} from 'discord.js';
import type {
    ClientWithCommands,
    Command
} from '../../types/ClientWithCommands';
import { handleError, handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { log } from "../../functions/logs/log";

export let interactionCreate: {
    name: string;
    once: boolean;
    execute(interaction: Interaction, client: ClientWithCommands): Promise<void>;
}

interactionCreate = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * @param interaction
     * @param client
     */
    async execute(interaction: Interaction, client: ClientWithCommands): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const command: Command | undefined = client.commands.get(commandName);

        if (!command) {
            log('warn', `[WARN] Commande inconnue reçue: ${commandName}`, { source: 'interactionCreate', includeStack: false })
            return;
        }

        try {
            await command.execute(interaction as ChatInputCommandInteraction, client);
            log('info', `✅ Commande /${commandName} exécutée avec succès par ${interaction.user.tag} (id=${interaction.user.id}).`, { source: commandName, includeStack: false });
        } catch (error) {
            if (interaction.isRepliable()) {
                await handleInteractionError(interaction, error, {
                    source: commandName,
                    logMessage: `Erreur interaction non-repliable.`,
                    includeStack: true
                });
            } else {
                handleError(error, {
                    source: commandName,
                    logMessage: 'Erreur interaction non-repliable.',
                    includeStack: true
                });
            }
        }
    },
} as const;
