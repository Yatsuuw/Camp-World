"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEvents = loadEvents;
const events_1 = require("../events");
const handleErrorOptions_1 = require("../functions/logs/handleErrorOptions");
function loadEvents(client) {
    for (const event of events_1.events) {
        const executor = async (...args) => {
            try {
                await event.execute(...args, client);
            }
            catch (error) {
                (0, handleErrorOptions_1.handleError)(error, {
                    source: event.name,
                    logMessage: `Erreur lors de l'exécution de l'évènement ${event.name}.`,
                    includeStack: true
                });
            }
        };
        if (event.once) {
            client.once(event.name, executor);
        }
        else {
            client.on(event.name, executor);
        }
    }
}
