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
            const setBotPresence = (isInitial = false) => {
                if (!client.user)
                    return;
                client.user.setPresence({
                    activities: [
                        {
                            name: 'Laid Back Camp season 3',
                            type: discord_js_1.ActivityType.Watching,
                            url: 'https://www.crunchyroll.com/fr/series/GRWEW95KR/laid-back-camp'
                        }
                    ],
                    status: 'online',
                });
                (0, log_1.log)('info', isInitial
                    ? '✅ Présence définie avec succès.'
                    : '✅ Présence définie avec succès (rafraichissement).', { source: 'ready', includeStack: false });
            };
            setBotPresence(true);
            const rawInterval = process.env.PRESENCE_REFRESH_INTERVAL;
            let refreshIntervalMinutes = 15;
            if (rawInterval !== undefined) {
                const parsed = Number(rawInterval);
                if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 1440) {
                    refreshIntervalMinutes = Math.floor(parsed);
                }
                else {
                    (0, log_1.log)('warn', `PRESENCE_REFRESH_INTERVAL invalide : ${rawInterval}. Utilisation de la valeur par défaut de 15 minutes.`, { source: 'ready', includeStack: false });
                }
            }
            const refreshIntervalMs = refreshIntervalMinutes * 60 * 1000;
            setInterval(() => setBotPresence(false), refreshIntervalMs);
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
