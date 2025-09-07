"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPagination = setupPagination;
const discord_js_1 = require("discord.js");
const paginationControls_1 = require("./paginationControls");
const handlePaginationButton_1 = require("./handlePaginationButton");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
/**
 * @param interaction
 * @param results
 * @param generateEmbed
 */
async function setupPagination(interaction, results, generateEmbed) {
    if (!results.length) {
        await (0, reply_1.safeReply)(interaction, '❌ Aucun résultat trouvé.', 'pagination');
        return;
    }
    let index = 0;
    let message;
    try {
        message = await interaction.editReply({
            embeds: [await generateEmbed(results[index], index)],
            components: (0, paginationControls_1.createPaginationControls)(index, results.length)
        });
    }
    catch (error) {
        await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
            source: 'pagination',
            logMessage: `Erreur lors de l'affichage initial de la pagination.`,
            includeStack: true
        });
        return;
    }
    const collector = message.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 120000
    });
    collector.on('collect', async (btn) => {
        try {
            const newIndex = await (0, handlePaginationButton_1.handlePaginationButton)(btn, interaction.user.id, index, results.length);
            if (newIndex === null)
                return;
            index = newIndex;
            if (btn.customId === 'select') {
                collector.stop('selected');
                return btn.editReply({
                    embeds: [await generateEmbed(results[index], index)],
                    components: []
                });
            }
            if (btn.customId === 'delete') {
                collector.stop('deleted');
                return await interaction.deleteReply();
            }
            await btn.editReply({
                embeds: [await generateEmbed(results[index], index)],
                components: (0, paginationControls_1.createPaginationControls)(index, results.length)
            });
        }
        catch (error) {
            await (0, handleErrorOptions_1.handleInteractionError)(btn, error, {
                source: 'pagination',
                logMessage: `Erreur lors du clic sur un bouton (id=${btn.customId}, index=${index}).`,
                includeStack: true
            });
        }
    });
    collector.on('end', async (_, reason) => {
        if (reason !== 'selected') {
            try {
                await interaction.editReply({ components: [] });
            }
            catch (error) {
                (0, handleErrorOptions_1.handleError)(error, {
                    source: 'pagination',
                    logMessage: `Erreur lors du nettoyage de la pagination à la fin du collector.`,
                    includeStack: false
                });
            }
        }
    });
}
