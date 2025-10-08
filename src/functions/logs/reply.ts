import { Interaction } from "discord.js";
import { formatError } from "./formatError";
import { log } from "./log";

export async function replyOrFollowUpSafe(
    interaction: Interaction,
    content: string,
    source?: string | undefined
): Promise<void> {
    try {
        if (!interaction.isRepliable()) return;

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content, flags: 64 });
        } else {
            await interaction.reply({ content, flags: 64 });
        }
    } catch (error: unknown) {
        const idInfo = `interactionId=${(interaction as any).id ?? 'unknown'}`;
        const tag: any = source ?? (interaction as any).commandName ?? 'unknown';

        const errMsg = `[safeReply:${tag}] Échec d'envoi (${idInfo}) - ${formatError(error)}`;
        log('error', errMsg, {
            source: tag,
            includeStack: true,
        })
    }
}

export async function safeReply(
    interaction: Interaction,
    content: string,
    source?: string
): Promise<void> {
    await replyOrFollowUpSafe(interaction, content, source);
}