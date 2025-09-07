"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyOrFollowUpSafe = replyOrFollowUpSafe;
exports.safeReply = safeReply;
const formatError_1 = require("./formatError");
const log_1 = require("./log");
async function replyOrFollowUpSafe(interaction, content, source) {
    try {
        if (!interaction.isRepliable())
            return;
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content, flags: 64 });
        }
        else {
            await interaction.reply({ content, flags: 64 });
        }
    }
    catch (error) {
        const idInfo = `interactionId=${interaction.id ?? 'unknown'}`;
        const tag = source ?? interaction.commandName ?? 'unknown';
        const errMsg = `[safeReply:${tag}] Échec d'envoi (${idInfo}) - ${(0, formatError_1.formatError)(error)}`;
        (0, log_1.log)('error', errMsg, {
            source: tag,
            includeStack: true,
        });
    }
}
async function safeReply(interaction, content, source) {
    await replyOrFollowUpSafe(interaction, content, source);
}
