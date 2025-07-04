import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandStringOption,
    PermissionFlagsBits
} from 'discord.js';
import { pool } from '../utils/database/database';
import {isServerInitialized} from "../functions/isServerInitialized";

const sitePreferenceCommand = {
    data: new SlashCommandBuilder()
        .setName('site_preference')
        .setDescription('Enregistre le site de votre choix comme préférence pour les recherches de mangas et animés.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('site')
                .setDescription('Ton site pour répertorier tes mangas et animés.')
                .setRequired(true)
                .addChoices(
                    { name: 'MyAnimeList', value: '1' },
                    { name: 'AniList', value: '2' },
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const userId: string = interaction.user.id;
        const website: string = interaction.options.getString('site', true);

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

            if (rows.length === 0) {
                await conn.query(
                    'INSERT INTO users (user, website) VALUES (?, ?)',
                    [userId, website]
                );
            } else {
                await conn.query(
                    'UPDATE users SET website = ? WHERE user = ?',
                    [website, userId]
                );
            }

            await interaction.reply({
                content: 'Préférence enregistrée avec succès.',
                flags: 64
            });
        } catch (err) {
            console.error('[Erreur DB] ', err);
            await interaction.reply({
                content: 'Une erreur est survenue.',
                flags: 64
            });
        } finally {
            if (conn) conn.release();
        }
    }
}

export default sitePreferenceCommand;