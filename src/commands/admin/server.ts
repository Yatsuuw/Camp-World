import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandStringOption
} from 'discord.js';
import { pool } from "../../utils/database/database";
import { isServerInitialized } from "../../functions/isServerInitialized";
import { handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";
import { log } from "../../functions/logs/log";

const serverCommand = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Gérez le statut de votre serveur dans la base de données.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('action')
                .setDescription('Action à effectuer sur votre serveur dans la base de données')
                .addChoices(
                    { name: 'Initialiser', value: 'init' },
                    { name: 'Supprimer', value: 'delete' }
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId: string = interaction.guild?.id || '';
        const ownerId: string = interaction.guild?.ownerId || '';
        const guildName: string = interaction.guild?.name || '';
        const action: string = interaction.options.getString('action', true);

        if (!serverId) {
            await safeReply(interaction, 'Impossible de déterminer le serveur.', 'server');
            log('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec hors serveur`, { source: 'server', includeStack: false });
            return;
        }

        try {
            const initialized: boolean = await isServerInitialized(serverId);

            if (action === 'init') {
                if (initialized) {
                    await safeReply(interaction, "Ce serveur est déjà initialisé dans la base de données.", 'server');
                    return;
                }
                try {
                    await pool.query(
                        'INSERT INTO servers (id, owner) VALUES (?, ?)',
                        [serverId, ownerId]
                    );
                    await safeReply(interaction, `Serveur ${guildName} initialisé avec succès.`, 'server');
                } catch (dbErr: unknown) {
                    await handleInteractionError(interaction, dbErr, {
                        source: 'server',
                        userMessage: "❌ Erreur DB: impossible d'initialiser le serveur pour le moment.",
                        logMessage: `INSERT servers échoué (id=${serverId}, owner=${ownerId})`,
                        includeStack: true
                    });
                    return;
                }
                return;
            }

            if (!initialized) {
                await safeReply(interaction, "Ce serveur n'est pas initialisé.", 'server');
                return;
            }
            try {
                await pool.query(
                    'DELETE FROM servers WHERE id = ? AND owner = ?',
                    [serverId, ownerId]
                );
                await safeReply(interaction, `Serveur ${guildName} supprimé avec succès.`, 'server');
            } catch (dbErr: unknown) {
                await handleInteractionError(interaction, dbErr, {
                    source: 'server',
                    userMessage: '❌ Erreur DB: impossible de supprimer ce serveur pour le moment.',
                    logMessage: `DELETE servers échoué (id=${serverId}, owner=${ownerId})`,
                    includeStack: true
                });
                return;
            }

            log('info', `${interaction.user.globalName} (${interaction.user.id}) - ${action} - ${guildName} - Réussite en serveur`, { source: 'server', includeStack: false })
        } catch (err: unknown) {
            await handleInteractionError(interaction, err, {
                source: 'server',
                userMessage: '❌ Erreur inattendue. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /server',
                includeStack: true
            });
            return;
        }
    }
};

export default serverCommand;