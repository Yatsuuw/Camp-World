import { Interaction } from "discord.js";
import { log } from "./log";
import { formatError } from "./formatError";
import { replyOrFollowUpSafe } from "./reply";

export interface HandleErrorOptions {
    source?: string;
    userMessage?: string;
    logMessage?: string;
    includeStack?: boolean;
}

export async function handleInteractionError(
    interaction: Interaction,
    error: unknown,
    options: HandleErrorOptions = {}
): Promise<void> {
    const {
        source = (interaction as any).commandName ?? interaction.type ?? 'unknown',
        userMessage = '❌ Une erreur est survenue. Réessayez plus tard.',
        logMessage = 'Erreur inattendue',
        includeStack = true
    } = options;

    const idInfo = `interactionId=${(interaction as any).id ?? 'unknown'}`;
    const message = `[handleInteractionError:${source}] ${logMessage} (${idInfo}) - ${formatError(error, includeStack)}`;

    log('error', message, {
        source,
        includeStack,
    })

    if (!interaction.isRepliable()) return;

    try {
        if (interaction.deferred) {
            await interaction.editReply({ content: userMessage });
            return;
        }
        await replyOrFollowUpSafe(interaction, userMessage, source);
    } catch (notifyErr: unknown) {
        const notifyMessage = `[handleInteractionError:${source}] Échec de notification utilisateur (${idInfo}) - ${formatError(notifyErr, includeStack)}`;
        log('error', notifyMessage, {
            source,
            includeStack,
        })
    }
}

export function handleError(
    error: unknown,
    options: HandleErrorOptions = {}
): void {
    const {
        source = 'unknown',
        logMessage = 'Erreur inattendue',
        includeStack = true
    } = options;

    const message = `[handleError:${source}] ${logMessage} - ${formatError(error, includeStack)}`;

    log('error', message, {
        source,
        includeStack,
    });
}
