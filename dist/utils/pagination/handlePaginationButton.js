"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaginationButton = handlePaginationButton;
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
async function handlePaginationButton(btn, interactionUserId, index, total) {
    try {
        if (btn.user.id !== interactionUserId) {
            await (0, reply_1.safeReply)(btn, '❌ Ce bouton n’est pas pour toi !');
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
    }
    catch (error) {
        await (0, handleErrorOptions_1.handleInteractionError)(btn, error, {
            source: 'pagination',
            userMessage: '❌ Erreur lors de la gestion de la pagination.',
            logMessage: `Échec dans handlePaginationButton (customId=${btn.customId}, user=${btn.user.id})`,
            includeStack: true
        });
        return null;
    }
}
