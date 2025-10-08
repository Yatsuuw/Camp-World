import { ButtonInteraction } from 'discord.js';
import { handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";

export async function handlePaginationButton(
    btn: ButtonInteraction,
    interactionUserId: string,
    index: number,
    total: number
): Promise<number | null> {
    try {
        if (btn.user.id !== interactionUserId) {
            await safeReply(btn as any, '❌ Ce bouton n’est pas pour toi !');
            return null;
        }

        if (!btn.deferred && !btn.replied) {
            await btn.deferUpdate();
        }

        switch (btn.customId) {
            case 'first':
                return index === 0 ? index : 0;
            case 'prev':
                return index > 0 ? index - 1 : index;
            case 'next':
                return index < total - 1 ? index + 1 : index;
            case 'last':
                return index === total - 1 ? index : total - 1;
            default:
                return index;
        }
    } catch (error: unknown) {
        await handleInteractionError(btn as any, error, {
            source: 'pagination',
            userMessage: '❌ Erreur lors de la gestion de la pagination.',
            logMessage: `Échec dans handlePaginationButton (customId=${btn.customId}, user=${btn.user.id})`,
            includeStack: true
        });
        return null;
    }
}
