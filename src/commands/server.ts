import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandStringOption
} from 'discord.js';
import { pool } from "../utils/database/database";
import {isServerInitialized} from "../functions/isServerInitialized";

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

        if (!serverId || !ownerId) {
            await interaction.reply({
                content: 'Impossible de déterminer le serveur.',
                flags: 64
            });
            return;
        }

        let conn;
        try {
            conn = await pool.getConnection();
            const initialized: boolean = await isServerInitialized(serverId);

            if (action === 'init') {
                if (initialized) {
                    await interaction.reply({
                        content: "Ce serveur est déjà initialisé dans la base de données.",
                        flags: 64
                    });
                    return;
                }

                await conn.query(
                    'INSERT INTO servers (id, owner) VALUES (?, ?)',
                    [serverId, ownerId]
                );

                await interaction.reply({
                    content: `Serveur ${guildName} initialisé avec succès.`,
                    flags: 64
                });
            } else {
                if (!initialized) {
                    await interaction.reply({
                        content: "Ce serveur n'est pas initialisé. Utilisez la commande `/init` pour l'initialiser.",
                        flags: 64
                    });
                    return;
                }

                await conn.query(
                    'DELETE FROM servers WHERE id = ? AND owner = ?',
                    [serverId, ownerId]
                );

                await interaction.reply({
                    content: `Serveur ${guildName} supprimé avec succès.`,
                    flags: 64
                });
            }
        } catch (err) {
            console.error('Erreur lors de l\'initialisation du serveur :', err);
            await interaction.reply({
                content: 'Une erreur est survenue lors de l\'initialisation du serveur.',
                flags: 64
            });
        } finally {
            if (conn) conn.release();
        }
    }
};

export default serverCommand;