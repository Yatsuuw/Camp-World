"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readyEvent = void 0;
const discord_js_1 = require("discord.js");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const log_1 = require("../../functions/logs/log");
exports.readyEvent = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        try {
            if (!client.user) {
                console.error(`❌ Le client n'a pas de user après le ready event.`);
                return;
            }
            (0, log_1.log)('info', `✅ Connecté en tant que ${client.user.tag}.`, { source: 'ready', includeStack: false });
            client.user.setPresence({
                activities: [
                    {
                        name: 'Laid Back Camp season 3',
                        type: discord_js_1.ActivityType.Watching,
                    }
                ],
                status: 'online',
            });
            (0, log_1.log)('info', '✅ Présence définie avec succès.', { source: 'ready', includeStack: false });
        }
        catch (error) {
            (0, handleErrorOptions_1.handleError)(error, {
                source: 'ready',
                logMessage: `Erreur lors de l'évènement ready.`,
                includeStack: true,
            });
        }
    }
};
