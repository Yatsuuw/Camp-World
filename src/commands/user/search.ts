import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandStringOption,
    PermissionFlagsBits
} from 'discord.js';
import fetchAniListMangas from '../../functions/Mangas/fetchAniListMangas';
import fetchAniListAnimes from '../../functions/Animes/fetchAniListAnimes';
import { isServerInitialized } from '../../functions/isServerInitialized';
import { handleInteractionError } from '../../functions/logs/handleErrorOptions';
import { safeReply } from "../../functions/logs/reply";
import { log } from "../../functions/logs/log";

type SearchType = 'anime' | 'manga';

const searchCommand = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Recherche un manga ou un animé (AniList + lien MAL si disponible).')
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
                .setDescription('Titre du manga ou animé à rechercher')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            if (interaction.guild) {
                const ok: boolean = await isServerInitialized(interaction.guild.id);
                if (!ok) {
                    await safeReply(interaction, "Ce serveur n'est pas initialisé. Contactez un administrateur.", 'search');
                    log('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'search', includeStack: false });
                    return;
                }
            }

            const typeOpt: string = interaction.options.getString('type', true);
            const type: SearchType = typeOpt as SearchType;
            const query: string = (interaction.options.getString('titre', true) || '').trim();
            const location: string = interaction.guild ? 'serveur' : 'messages privés'

            if (!query) {
                await safeReply(interaction, 'Veuillez fournir un titre non vide.', 'search');
                return;
            }

            try {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferReply();
                }
             } catch (error: unknown) {
                 await handleInteractionError(interaction, error, {
                     source: 'search',
                     logMessage: 'Echec de deferReply.',
                     includeStack: true,
                 });
                 return;
             }

            if (type === 'anime') {
                await fetchAniListAnimes(query, interaction);
            } else {
                await fetchAniListMangas(query, interaction);
            }

            log('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${query} - Réussite en ${location}`, { source: 'search', includeStack: false });
        } catch (err: unknown) {
            await handleInteractionError(interaction, err, {
                source: 'search',
                userMessage: '❌ Erreur: la recherche a échoué. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /search',
                includeStack: true
            });
            return;
        }
    }
};

export default searchCommand;