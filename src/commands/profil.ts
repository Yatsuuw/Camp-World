import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandUserOption,
    User,
    EmbedBuilder,
} from 'discord.js';
import { pool } from '../utils/database/database';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { CheerioAPI } from "cheerio";
import {isServerInitialized} from "../functions/isServerInitialized";

const profileCommand = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Affiche ton profil MyAnimeList ou AniList.')
        .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption =>
            option
                .setName("membre")
                .setDescription("Affiche le profil d'un autre membre.")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.guild) {
            if (!(await isServerInitialized(interaction.guild.id))) {
                await interaction.reply({
                    content: 'Le serveur n\'est pas initialisé dans la base de données. Veuillez contacter un administrateur.',
                    flags: 64,
                });
                return;
            }
        }

        const target: User | null = interaction.options.getUser('membre', false);

        const selectedUser: User = target ?? interaction.user;
        const selectedUserId: string = selectedUser.id;

        let conn;
        try {
            conn = await pool.getConnection();
            const queryResult: any[] = await conn.query(
                'SELECT website, username FROM users WHERE user = ?',
                [selectedUserId]
            );

            if (!queryResult || queryResult.length === 0) {
                const isSelf: boolean = !target;
                await interaction.reply({
                    content: isSelf
                        ? `Tu n'as pas encore défini ton site préféré. Utilisez /site_preference.`
                        : `L'utilisateur ${target?.username} n'a pas encore défini son site préféré.`
                    ,
                    flags: 64,
                });
                return;
            }

            const { website, username } = queryResult[0];
            let embed: EmbedBuilder;

            if (website === '1') {
                const profileUrl = `https://myanimelist.net/profile/${username}`;
                const { data: html } = await axios.get(profileUrl);
                const $: CheerioAPI = cheerio.load(html);

                const name: any = $('.user-header-name h1').text().trim() || username;
                const avatarElement = $('div.user-profile div.user-image img');
                const avatar: string = avatarElement.attr('data-src')
                    || avatarElement.attr('src')
                    || 'https://cdn.myanimelist.net/images/favicon.ico';


                embed = new EmbedBuilder()
                    .setTitle(`Profil MyAnimeList de ${name}`)
                    .setURL(profileUrl)
                    .setThumbnail(avatar)
                    .setColor(0x2E51A2)
                    .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });


                await interaction.reply({ embeds: [embed] });

            } else if (website === '2') {
                const query = `
                  query ($name: String) {
                    User(name: $name) {
                      name
                      avatar {
                        large
                      }
                      siteUrl
                    }
                  }
                `;
                const variables = { name: username };
                const response: AxiosResponse = await axios.post('https://graphql.anilist.co', { query, variables }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                const userData: any = response.data.data.User;

                if (!userData) {
                    await interaction.reply({
                        content: 'Utilisateur AniList introuvable.',
                        flags: 64,
                    });
                    return;
                }

                embed = new EmbedBuilder()
                    .setTitle(`Profil AniList de ${userData.name}`)
                    .setURL(userData.siteUrl)
                    .setThumbnail(userData.avatar.large)
                    .setColor(0x00ccbc)
                    .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: 'Site préféré non reconnu. Utilise `/site_preference`.',
                    flags: 64,
                });
            }
        } catch (error) {
            console.error('Erreur /profile :', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la récupération de ton profil.',
                flags: 64,
            });
        } finally {
            if (conn) conn.release();
        }
    },
};

export default profileCommand;
