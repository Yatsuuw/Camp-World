import { ActivityType } from "discord.js";
import { ClientWithCommands } from "../../types/ClientWithCommands";
import { handleError } from "../../functions/logs/handleErrorOptions";
import { log } from "../../functions/logs/log";

export let readyEvent: {
    name: string;
    once: boolean;
    execute(client: ClientWithCommands): Promise<void>
};

readyEvent = {
    name: 'clientReady',
    once: true,

    async execute(client: ClientWithCommands): Promise<void> {
        try {
            if (!client.user) {
                console.error(`❌ Le client n'a pas de user après le ready event.`);
                return;
            }

            log('info', `✅ Connecté en tant que ${client.user.tag}.`, { source: 'ready', includeStack: false });

            const setBotPresence: (isInitial?: boolean) => void = (isInitial = false): void => {
                if (!client.user) return;

                client.user.setPresence({
                    activities: [
                        {
                            name: 'Laid Back Camp season 3',
                            type: ActivityType.Watching,
                            url: 'https://www.crunchyroll.com/fr/series/GRWEW95KR/laid-back-camp'
                        }
                    ],
                    status: 'online',
                });

                log(
                    'info',
                    isInitial
                        ? '✅ Présence définie avec succès.'
                        : '✅ Présence définie avec succès (rafraichissement).',
                    { source: 'ready', includeStack: false });
            };

            setBotPresence(true);

            const rawInterval: string | undefined = process.env.PRESENCE_REFRESH_INTERVAL;
            let refreshIntervalMinutes: number = 15;

            if (rawInterval !== undefined) {
                const parsed: number = Number(rawInterval);
                if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 1440) {
                    refreshIntervalMinutes = Math.floor(parsed);
                } else {
                    log('warn', `PRESENCE_REFRESH_INTERVAL invalide : ${rawInterval}. Utilisation de la valeur par défaut de 15 minutes.`, { source: 'ready', includeStack: false });
                }
            }

            const refreshIntervalMs: number = refreshIntervalMinutes * 60 * 1000;

            setInterval((): void => setBotPresence(false), refreshIntervalMs);
        } catch (error) {
            handleError(error, {
                source: 'ready',
                logMessage: `Erreur lors de l'évènement ready.`,
                includeStack: true,
            })
        }
    }
};
