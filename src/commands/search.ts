import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandStringOption,
    PermissionFlagsBits
} from 'discord.js';
import fetchMyAnimeListManga from '../functions/Mangas/fetchMyAnimeListManga';
import fetchAniListManga from "../functions/Mangas/fetchAniListManga";
import getUserSitePreference from "../functions/userSitePreference";
import fetchMyAnimeListAnimes from "../functions/Animes/fetchMyAnimeListAnimes";
import fetchAniListAnimes from "../functions/Animes/fetchAniListAnimes";
import { isServerInitialized } from "../functions/isServerInitialized";

const searchCommand = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Recherche un manga ou un animé sur MyAnimeList ou AniList.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('type')
                .setDescription('Objet de votre recherche')
                .addChoices(
                    { name: 'Manga', value: 'manga' },
                    { name: 'Animé', value: 'anime' }
                )
                .setRequired(true)
        )
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('titre')
                .setDescription('Titre du manga/animé à rechercher')
                .setRequired(true)
        )
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('site')
                .setDescription('Choisissez le site pour la recherche')
                .setRequired(false)
                .addChoices(
                    { name: 'MyAnimeList', value: 'mal' },
                    { name: 'AniList', value: 'anilist' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const type: string = interaction.options.getString('type', true);
        const query: string = interaction.options.getString('titre', true);

        // Vérification serveur initialisé
        if (interaction.guild && !(await isServerInitialized(interaction.guild.id))) {
            await interaction.reply({
                content: 'Le serveur n’est pas initialisé. Veuillez contacter un administrateur.',
                flags: 64
            });
            return;
        }

        await interaction.deferReply();

        // Détermination du site
        const website: string = interaction.options.getString('site')
            ?? await getUserSitePreference(interaction.user.id);

        try {
            if (type === 'anime' && website === 'mal') {
                await fetchMyAnimeListAnimes(query, interaction);
                return;
            } else if (type === 'anime' && website === 'anilist') {
                await fetchAniListAnimes(query, interaction);
                return;
            }

            if (type === 'anime') {
                if (website === 'mal') {
                    await fetchMyAnimeListAnimes(query, interaction);
                } else {
                    await fetchAniListAnimes(query, interaction);
                }
            } else {
                if (website === 'mal') {
                    await fetchMyAnimeListManga(query, interaction);
                } else {
                    await fetchAniListManga(query, interaction);
                }
            }
        } catch (err) {
            console.error(`API error (${type} / ${website}):`, err);
            await interaction.editReply({
                content: `❌ Erreur lors de la requête ${website === 'mal' ? 'MyAnimeList' : 'AniList'}, aucun ${type} trouvé pour “${query}”.`
            });
        }
    }
};

export default searchCommand;
