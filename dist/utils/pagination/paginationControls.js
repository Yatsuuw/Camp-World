"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationControls = createPaginationControls;
const discord_js_1 = require("discord.js");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
function createPaginationControls(index, total) {
    if (total <= 0) {
        (0, handleErrorOptions_1.handleError)(new Error(`Total invalide (${total}), au moins 1 élément attendu.`), {
            source: 'pagination',
            logMessage: `Erreur lors de la création des contrôles (index=${index}, total=${total}`,
            includeStack: true
        });
        const fallback = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('delete')
            .setLabel('🗑️')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        return [fallback];
    }
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('first')
        .setLabel('⏪')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(index === 0), new discord_js_1.ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(index === 0), new discord_js_1.ButtonBuilder()
        .setCustomId('next')
        .setLabel('➡️')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(index === total - 1), new discord_js_1.ButtonBuilder()
        .setCustomId('last')
        .setLabel('⏩')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(index === total - 1));
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('select')
        .setLabel('✅')
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId('delete')
        .setLabel('🗑️')
        .setStyle(discord_js_1.ButtonStyle.Danger));
    return [row1, row2];
}
