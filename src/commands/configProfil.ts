import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandStringOption,
    PermissionFlagsBits,
} from 'discord.js';
import { pool } from '../utils/database';
import {isServerInitialized} from "../functions/isServerInitialized";

const configProfilCommand = {
    data: new SlashCommandBuilder()
        .setName('config_profil')
        .setDescription('Configurez votre profil MyAnimeList/AniList et MangaCollec.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('type')
                .setDescription('Nom de votre profil sur MyAnimeList ou AniList.')
                .addChoices(
                    { name: 'MyAnimeList/AniList', value: 'profile' },
                    { name: 'MangaCollec', value: 'mangacollec' }
                )
                .setRequired(true)
        )
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('nom')
                .setDescription('Nom de votre profil sur MyAnimeList ou AniList.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const userId: string = interaction.user.id;
        const username: string = interaction.options.getString('nom', true);
        const mangacollec: string = interaction.options.getString('nom', true);
        const type: string = interaction.options.getString('type', true);

        if (interaction.guild) {
            if (!(await isServerInitialized(interaction.guild.id))) {
                await interaction.reply({
                    content: 'Le serveur n\'est pas initialisé dans la base de données. Veuillez contacter un administrateur.',
                    flags: 64,
                });
                return;
            }
        }

        let conn;
        try {
            conn = await pool.getConnection();

            const rows: any = await conn.query(
                'SELECT 1 FROM users WHERE user = ?',
                [userId]
            );

            if (type === 'profile') {
                if (rows.length === 0) {
                    await conn.query(
                        'INSERT INTO users (user, username) VALUES (?, ?)',
                        [userId, username]
                    );
                } else {
                    await conn.query(
                        'UPDATE users SET username = ? WHERE user = ?',
                        [username, userId]
                    );
                }
            } else {
                if (rows.length === 0) {
                    await conn.query(
                        'INSERT INTO users (user, mangacollec) VALUES (?, ?)',
                        [userId, mangacollec]
                    );
                } else {
                    await conn.query(
                        'UPDATE users SET mangacollec = ? WHERE user = ?',
                        [mangacollec, userId]
                    );
                }
            }

            await interaction.reply({
                content: `Le paramètre ${type} de votre profil a été mis à jour avec succès.`,
                flags: 64
            });
        } catch (error) {
            console.error('[Erreur DB] ', error);
            await interaction.reply({
                content: 'Une erreur est survenue.',
                flags: 64,
            });
        } finally {
            if (conn) conn.release();
        }
    }
}

export default configProfilCommand;