import axios, {AxiosResponse} from 'axios';
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    InteractionCollector,
    InteractionResponse,
    Message,
    ReadonlyCollection,
} from 'discord.js';
import {createPaginationControls} from "../../utils/pagination/paginationControls";
import {handlePaginationButton} from "../../utils/pagination/handlePaginationButton";

export default async function fetchJikanAnimes(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = `${process.env.JK_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw`;

    const response: AxiosResponse = await axios.get(url);
    const results: any[] = response.data?.data ?? [];

    if (!results.length) {
        throw new Error('Aucun animé trouvé sur Jikan.');
    }

    let index: number = 0;

    const generateEmbed: (anime: any) => Promise<EmbedBuilder> = async (anime: any): Promise<EmbedBuilder> => {
        const altTitles: string[] = [];

        if (anime.title_english && anime.title_english !== anime.title) {
            altTitles.push(anime.title_english);
        }
        if (anime.title_japanese && anime.title_japanese !== anime.title) {
            altTitles.push(anime.title_japanese);
        }
        if (anime.title_synonyms?.length) {
            altTitles.push(...anime.title_synonyms.filter((t: string): boolean => t !== anime.title));
        }

        let aniListUrl: string = process.env.AL_URL || '';
        const possibleTitles: string[] = [anime.title, anime.title_english, anime.title_japanese, ...(anime.title_synonyms ?? [])].filter((t: any, i: number, self: any[]): any => t && self.indexOf(t) === i);
        const query = `query ($search: String) {
                Media(type: ANIME, search: $search) {
                    id
                }
            }`;
        for (const title of possibleTitles) {
            try {
                const response: AxiosResponse = await axios.post(process.env.AL_API_BASE || '', {
                    query,
                    variables: {search: title}
                }, {
                    headers: {'Content-Type': 'application/json'}
                });

                const id: any = response.data?.data?.Media?.id;
                if (id) {
                    aniListUrl = `https://anilist.co/anime/${id}`;
                    break;
                }
            } catch (err) {
                console.warn(`❌ AniList ID non trouvé pour ${anime.title}`);
            }
        }

        return new EmbedBuilder()
            .setTitle(anime.title)
            .setURL(anime.url)
            .setImage(anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url ?? null)
            .setDescription(anime.synopsis
                ? (anime.synopsis.length > 1024
                    ? anime.synopsis.substring(0, 1021) + '…'
                    : anime.synopsis)
                : 'Synopsis non disponible.')
            .addFields(
                { name: 'Score', value: anime.score?.toString() ?? 'Non noté', inline: true },
                { name: 'Classement', value: anime.rank ? `#${anime.rank}` : 'Non classé', inline: true },
                { name: 'Popularité', value: anime.popularity ? `#${anime.popularity}` : 'Inconnue', inline: true },
                { name: 'Statut', value: anime.status ?? 'Inconnu', inline: true },
                { name: 'Favoris', value: anime.favorites?.toLocaleString('fr-FR') ?? '0', inline: true },
                { name: 'Épisodes', value: anime.episodes?.toString() ?? 'Inconnu', inline: true },
                { name: 'Durée', value: anime.duration ?? 'Inconnue', inline: true },
                { name: 'Genres', value: anime.genres?.map((g: any): any => g.name).join(', ') || 'Non précisé', inline: false },
                { name: 'Studios', value: anime.studios?.map((s: any): any => s.name).join(', ') || 'Inconnu', inline: false },
                { name: 'Source', value: anime.source ?? 'Inconnue', inline: true },
                { name: 'Début', value: anime.aired?.from?.split('T')[0] ?? 'Inconnu', inline: true },
                { name: 'Fin', value: anime.aired?.to?.split('T')[0] ?? 'En cours', inline: true },
                { name: 'Titres alternatifs', value: altTitles.length ? altTitles.join(' | ') : 'Aucun', inline: false },
                { name: '🔗 Voir sur AniList', value: `[Ouvrir sur AniList](${aniListUrl})`, inline: false },
                { name: '🔗 Voir sur MyAnimeList', value: `[Ouvrir sur MyAnimeList](${anime.url})`, inline: false },
            )
            .setFooter({
                text: `Résultat ${index + 1}/${results.length} — Jikan`,
                iconURL: interaction.user.avatarURL() ?? undefined
            })
            .setColor(0xF38100)
            .setTimestamp();
    };

    const message: Message = await interaction.editReply({
        embeds: [await generateEmbed(results[index])],
        components: [createPaginationControls(index, results.length)]
    });

    const collector: InteractionCollector<ButtonInteraction> = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
    });

    collector.on('collect', async (btn: ButtonInteraction): Promise<void | Message | InteractionResponse> => {
        const newIndexAnimes: number | null = await handlePaginationButton(btn, interaction.user.id, index, results.length);
        if (newIndexAnimes === null) return;
        index = newIndexAnimes;

        if (btn.customId === "select") {
            collector.stop("selected");
            return btn.editReply({
                embeds: [await generateEmbed(results[index])],
                components: []
            });
        }

        if (btn.customId === "delete") {
            collector.stop("deleted");
            return await interaction.deleteReply();
        }

        await btn.editReply({
            embeds: [await generateEmbed(results[index])],
            components: [createPaginationControls(index, results.length)]
        });
    });

    collector.on('end', (_: ReadonlyCollection<string, ButtonInteraction>, reason: string): void => {
        if (reason !== 'selected') {
            interaction.editReply({ components: [] }).catch((): void => {});
        }
    });
}
