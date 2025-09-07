"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionCreate = void 0;
const discord_js_1 = require("discord.js");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const log_1 = require("../../functions/logs/log");
exports.interactionCreate = {
    name: discord_js_1.Events.InteractionCreate,
    once: false,
    /**
     * @param interaction
     * @param client
     */
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand())
            return;
        const { commandName } = interaction;
        const command = client.commands.get(commandName);
        if (!command) {
            (0, log_1.log)('warn', `[WARN] Commande inconnue reçue: ${commandName}`, { source: 'interactionCreate', includeStack: false });
            return;
        }
        try {
            await command.execute(interaction, client);
            (0, log_1.log)('info', `✅ Commande /${commandName} exécutée avec succès par ${interaction.user.tag} (id=${interaction.user.id}).`, { source: commandName, includeStack: false });
        }
        catch (error) {
            if (interaction.isRepliable()) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
                    source: commandName,
                    logMessage: `Erreur interaction non-repliable.`,
                    includeStack: true
                });
            }
            else {
                (0, handleErrorOptions_1.handleError)(error, {
                    source: commandName,
                    logMessage: 'Erreur interaction non-repliable.',
                    includeStack: true
                });
            }
        }
    },
};
