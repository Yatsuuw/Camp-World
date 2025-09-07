"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteractionError = handleInteractionError;
exports.handleError = handleError;
const log_1 = require("./log");
const formatError_1 = require("./formatError");
const reply_1 = require("./reply");
async function handleInteractionError(interaction, error, options = {}) {
    const { source = interaction.commandName ?? interaction.type ?? 'unknown', userMessage = '❌ Une erreur est survenue. Réessayez plus tard.', logMessage = 'Erreur inattendue', includeStack = true } = options;
    const idInfo = `interactionId=${interaction.id ?? 'unknown'}`;
    const message = `[handleInteractionError:${source}] ${logMessage} (${idInfo}) - ${(0, formatError_1.formatError)(error, includeStack)}`;
    (0, log_1.log)('error', message, {
        source,
        includeStack,
    });
    if (!interaction.isRepliable())
        return;
    try {
        if (interaction.deferred) {
            await interaction.editReply({ content: userMessage });
            return;
        }
        await (0, reply_1.replyOrFollowUpSafe)(interaction, userMessage, source);
    }
    catch (notifyErr) {
        const notifyMessage = `[handleInteractionError:${source}] Échec de notification utilisateur (${idInfo}) - ${(0, formatError_1.formatError)(notifyErr, includeStack)}`;
        (0, log_1.log)('error', notifyMessage, {
            source,
            includeStack,
        });
    }
}
function handleError(error, options = {}) {
    const { source = 'unknown', logMessage = 'Erreur inattendue', includeStack = true } = options;
    const message = `[handleError:${source}] ${logMessage} - ${(0, formatError_1.formatError)(error, includeStack)}`;
    (0, log_1.log)('error', message, {
        source,
        includeStack,
    });
}
