import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { handleError } from "../../functions/logs/handleErrorOptions";

export function createPaginationControls(index: number, total: number): ActionRowBuilder<ButtonBuilder>[] {
    if (total <= 0) {
        handleError(new Error(`Total invalide (${total}), au moins 1 élément attendu.`), {
            source: 'pagination',
            logMessage: `Erreur lors de la création des contrôles (index=${index}, total=${total}`,
            includeStack: true
        });

        const fallback: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️')
                .setStyle(ButtonStyle.Danger)
        );
        return [fallback];
    }

    const row1: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('first')
            .setLabel('⏪')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === 0),

        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === 0),

        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === total - 1),

        new ButtonBuilder()
            .setCustomId('last')
            .setLabel('⏩')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === total - 1),
    );

    const row2: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('select')
            .setLabel('✅')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('🗑️')
            .setStyle(ButtonStyle.Danger)
    );

    return [row1, row2];
}
