import axios, { AxiosResponse } from 'axios';
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
import { createPaginationControls } from '../../utils/pagination/paginationControls';
import { handlePaginationButton } from '../../utils/pagination/handlePaginationButton';

export default async function fetchJikanMangas(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = `${process.env.JK_API_BASE}/manga?q=${encodeURIComponent(query)}&limit=25`;

    console.log(url);
    const response: AxiosResponse = await axios.get(url);
    const results: string[] = response.data?.data ?? [];

    if (!results.length) {
        throw new Error('Aucun manga trouvé sur Jikan.');
    }

    let index: number = 0;

    const generateEmbed: (manga: any) => Promise<EmbedBuilder> = async (manga: any): Promise<EmbedBuilder> => {
        const altTitles: string[] = [];

        if (manga.title_english && manga.title_english !== manga.title) {
            altTitles.push(manga.title_english);
        }
        if (manga.title_japanese && manga.title_japanese !== manga.title) {
            altTitles.push(manga.title_japanese);
        }
        if (manga.title_synonyms?.length) {
            altTitles.push(...manga.title_synonyms.filter((t: string): boolean => t !== manga.title));
        }

        let aniListUrl: string = 'https://anilist.co';
        const possibleTitles: string[] = [
            manga.title,
            manga.title_english,
            manga.title_japanese,
            ...(manga.title_synonyms ?? [])
        ].filter((t: any, i: number, self: any[]): any => t && self.indexOf(t) === i);
        const query = `
            query ($search: String) {
                Media(type: MANGA, search: $search) {
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
                    aniListUrl = `https://anilist.co/manga/${id}`;
                    break;
                }
            } catch {
                console.warn(`❌ AniList ID non trouvé pour ${manga.title}`);
            }
        }

        return new EmbedBuilder()
            .setTitle(manga.title)
            .setURL(manga.url)
            .setImage(manga.images?.jpg?.large_image_url ?? manga.images?.jpg?.image_url ?? null)
            .setDescription(manga.synopsis
                ? (manga.synopsis.length > 1024
                    ? manga.synopsis.substring(0, 1021) + '…'
                    : manga.synopsis)
                : 'Synopsis non disponible.')
            .addFields(
                { name: 'Score', value: manga.score?.toString() ?? 'Non noté', inline: true },
                { name: 'Classement', value: manga.rank ? `#${manga.rank}` : 'Non classé', inline: true },
                { name: 'Popularité', value: manga.popularity ? `#${manga.popularity}` : 'Inconnue', inline: true },
                { name: 'Volumes', value: manga.volumes?.toString() ?? 'Inconnu', inline: true },
                { name: 'Chapitres', value: manga.chapters?.toString() ?? 'Inconnu', inline: true },
                { name: 'Statut', value: manga.status ?? 'Inconnu', inline: true },
                { name: 'Genres', value: manga.genres?.map((g: any) => g.name).join(', ') || 'Non précisé', inline: false },
                { name: 'Source', value: manga.source ?? 'Inconnue', inline: true },
                { name: 'Début', value: manga.published?.from?.split('T')[0] ?? 'Inconnu', inline: true },
                { name: 'Fin', value: manga.published?.to?.split('T')[0] ?? 'En cours', inline: true },
                { name: 'Titres alternatifs', value: altTitles.length ? altTitles.join(' | ') : 'Aucun', inline: false },
                {
                    name: '🔗 Voir en ligne',
                    value: `[MyAnimeList](${manga.url}) • [AniList](${aniListUrl})`,
                    inline: false
                }
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
        const newIndex: number | null = await handlePaginationButton(btn, interaction.user.id, index, results.length);
        if (newIndex === null) return;
        index = newIndex;

        if (btn.customId === 'select') {
            collector.stop('selected');
            return btn.editReply({
                embeds: [await generateEmbed(results[index])],
                components: []
            });
        }

        if (btn.customId === 'delete') {
            collector.stop('deleted');
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
