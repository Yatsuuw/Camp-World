import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandUserOption,
    EmbedBuilder,
    User,
} from 'discord.js';
import { pool } from '../utils/database';
import {isServerInitialized} from "../functions/isServerInitialized";

const profilMangaCollecCommand = {
    data: new SlashCommandBuilder()
        .setName('profil_mangacollec')
        .setDescription('Affiche ta collection MangaCollec ou celle d\'un autre membre.')
        .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption =>
            option
                .setName("membre")
                .setDescription("Affiche la collection d'un autre membre.")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const userId: string = interaction.user.id;
        const target: User | null = interaction.options.getUser('membre', false);
        const targetId: string = target?.id || '';

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

            let userToCheck: string = targetId || userId;
            let queryResult: any = await conn.query(
                'SELECT mangacollec FROM users WHERE user = ?',
                [userToCheck]
            );

            if (queryResult.length === 0) {
                const isSelf: boolean = !target;
                await interaction.reply({
                    content: isSelf
                        ? `Vous n'êtes pas encore enregistré dans la base de données.`
                        : `L'utilisateur ${target?.username} n'est pas encore enregistré dans la base de données.`,
                    flags: 64
                });
                return;
            }

            const mangacollec: any = queryResult[0].mangacollec;
            const collection_owner: User = target || interaction.user;

            if (!mangacollec) {
                await interaction.reply({
                    content: `${collection_owner.username} n'a pas encore configuré son identifiant MangaCollec.`,
                    flags: 64
                });
                return;
            }

            const embed: EmbedBuilder = new EmbedBuilder()
                .setTitle(`Collection MangaCollec de ${collection_owner.username}`)
                .setURL(`https://www.mangacollec.com/user/${mangacollec}/collection`)
                .setColor('Red')
                .setThumbnail(target?.avatarURL() || interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({
                    text: `Demandé par ${interaction.user.username}`,
                    iconURL: interaction.user.avatarURL() || undefined
                });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la récupération du profil MangaCollec :', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la récupération du profil MangaCollec.',
                flags: 64
            });
        } finally {
            if (conn) conn.release();
        }
    }
}

export default profilMangaCollecCommand;
