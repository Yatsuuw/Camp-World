import { Client } from "discord.js";
import { events } from "../events";
import { handleError } from "../functions/logs/handleErrorOptions";

export function loadEvents(client: Client): void {
    for (const event of events) {
        const executor: (...args: unknown[]) => Promise<void> = async (...args: unknown[]): Promise<void> => {
            try {
                await (event.execute as (...args: any[]) => Promise<void>)(...args, client);
            } catch (error: unknown) {
                handleError(error, {
                    source: event.name,
                    logMessage: `Erreur lors de l'exécution de l'évènement ${event.name}.`,
                    includeStack: true
                });
            }
        }

        if (event.once) {
            client.once(event.name, executor);
        } else {
            client.on(event.name, executor);
        }
    }
}
