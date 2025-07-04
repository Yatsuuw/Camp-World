import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';

export function createPaginationControls(index: number, total: number): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Précédent')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === 0),

        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('➡️ Suivant')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === total - 1),

        new ButtonBuilder()
            .setCustomId('select')
            .setLabel('✅ Sélectionner')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('🗑️ Supprimer')
            .setStyle(ButtonStyle.Danger)
    );
}
