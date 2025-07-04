import { ButtonInteraction } from 'discord.js';

export async function handlePaginationButton(
    btn: ButtonInteraction,
    interactionUserId: string,
    index: number,
    total: number
): Promise<number | null> {
    if (btn.user.id !== interactionUserId) {
        await btn.reply({
            content: '❌ Ce bouton n’est pas pour toi !',
            flags: 64
        });
        return null;
    }

    if (!btn.deferred && !btn.replied) {
        await btn.deferUpdate();
    }

    if (btn.customId === 'next' && index < total - 1) {
        return index + 1;
    } else if (btn.customId === 'prev' && index > 0) {
        return index - 1;
    }

    return index;
}
