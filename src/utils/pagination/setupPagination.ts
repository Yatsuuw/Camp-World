import {
    ButtonInteraction, ChatInputCommandInteraction,
    ComponentType,
    InteractionCollector,
    InteractionResponse,
    Message,
    ReadonlyCollection
} from 'discord.js';
import { createPaginationControls } from './paginationControls';
import { handlePaginationButton } from './handlePaginationButton';
import { handleError, handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";

/**
 * @param interaction
 * @param results
 * @param generateEmbed
 */

export async function setupPagination<T>(
    interaction: ChatInputCommandInteraction,
    results: T[],
    generateEmbed: (item: T, index: number) => Promise<any>
): Promise<void> {
    if (!results.length) {
        await safeReply(interaction, '❌ Aucun résultat trouvé.', 'pagination');
        return;
    }

    let index: number = 0;
    let message: Message;
    let wasDeleted: boolean = false;

    try {
        message = await interaction.editReply({
            embeds: [await generateEmbed(results[index], index)],
            components: createPaginationControls(index, results.length)
        });
    } catch (error: unknown) {
        await handleInteractionError(interaction, error, {
            source: 'pagination',
            logMessage: `Erreur lors de l'affichage initial de la pagination.`,
            includeStack: true
        });
        return;
    }

    const collector: InteractionCollector<ButtonInteraction> = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
    });

    collector.on('collect', async (btn: ButtonInteraction): Promise<void | Message | InteractionResponse> => {
        try {
            const newIndex: number | null = await handlePaginationButton(btn, interaction.user.id, index, results.length);
            if (newIndex === null) return;
            index = newIndex;

            if (btn.customId === 'select') {
                collector.stop('selected');
                return btn.editReply({
                    embeds: [await generateEmbed(results[index], index)],
                    components: []
                });
            }

            if (btn.customId === 'delete') {
                wasDeleted = true;
                collector.stop('deleted');
                return await interaction.deleteReply();
            }

            await btn.editReply({
                embeds: [await generateEmbed(results[index], index)],
                components: createPaginationControls(index, results.length)
            });
        } catch (error: unknown) {
            await handleInteractionError(btn, error, {
                source: 'pagination',
                logMessage: `Erreur lors du clic sur un bouton (id=${btn.customId}, index=${index}).`,
                includeStack: true
            });
        }
    });

    collector.on('end', async (_: ReadonlyCollection<string, ButtonInteraction>, reason: string): Promise<void> => {
        if (reason !== 'selected') {
            try {
                if (!wasDeleted) {
                    await interaction.editReply({ components: [] });
                }
            } catch (error: unknown) {
                handleError(error, {
                    source: 'pagination',
                    logMessage: `Erreur lors du nettoyage de la pagination à la fin du collector.`,
                    includeStack: false
                });
            }
        }
    });
}
