import axios, {AxiosResponse} from "axios";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    InteractionResponse,
    InteractionCollector,
    ReadonlyCollection
} from "discord.js";
import {createPaginationControls} from "../../utils/pagination/paginationControls";
import {handlePaginationButton} from "../../utils/pagination/handlePaginationButton";

export default async function fetchMyAnimeListAnimes(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = `${process.env.MAL_API_BASE}/anime`;
    const params = {
        q: query,
        limit: 10,
        offset: 0,
        fields: [
            'id',
            'title',
            'alternative_titles',
            'main_picture',
            'genres',
            'mean',
            'rank',
            'popularity',
            'num_episodes',
            'average_episode_duration',
            'start_date',
            'end_date',
            'studios',
            'source',
            'status',
            'num_favorites',
            'synopsis'
        ].join(',')
    };

    const response: AxiosResponse = await axios.get(url, {
        params,
        headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID }
    });

    const results: any[] = response.data?.data ?? [];
    if (!results.length) {
        throw new Error('Aucun animé trouvé sur MyAnimeList.');
    }

    let index: number = 0;

    const generateEmbed: (animeData: any) => EmbedBuilder = (animeData: any): EmbedBuilder => {
        const n: any = animeData.node;
        const alts = [
            ...(n.alternative_titles?.synonyms || []),
            n.alternative_titles?.en,
            n.alternative_titles?.ja
        ].filter(Boolean) as string[];

        return new EmbedBuilder()
            .setTitle(n.title)
            .setURL(`https://myanimelist.net/anime/${n.id}`)
            .setImage(n.main_picture?.large ?? n.main_picture?.medium ?? null)
            .setDescription(
                n.synopsis
                    ? (n.synopsis.length > 1024
                        ? n.synopsis.substring(0, 1021) + '…'
                        : n.synopsis)
                    : 'Synopsis non disponible.'
            )
            .addFields(
                { name: 'Score moyen', value: n.mean?.toString() ?? 'Non noté', inline: true },
                { name: 'Classement global', value: n.rank ? `#${n.rank}` : 'Non classé', inline: true },
                { name: 'Popularité', value: n.popularity ? `#${n.popularity}` : 'Inconnue', inline: true },
                { name: 'Statut', value: n.status ?? 'Inconnu', inline: true },
                { name: 'Favoris', value: n.num_favorites?.toString() ?? '0', inline: true },
                { name: 'Épisodes', value: n.num_episodes?.toString() ?? 'Inconnu', inline: true },
                { name: 'Durée/épisode', value: n.average_episode_duration ? `${Math.round(n.average_episode_duration/60)} min` : 'Inconnu', inline: true },
                { name: 'Source', value: n.source ?? 'Inconnue', inline: true },
                { name: 'Genres', value: n.genres?.map((g: any): any => g.name).join(', ') || 'Non précisé', inline: false },
                { name: 'Studios', value: n.studios?.map((s: any): any => s.name).join(', ') || 'Inconnu', inline: false },
                { name: 'Titres alternatifs', value: alts.length ? alts.join(' | ') : 'Aucun', inline: false },
                { name: 'Début', value: n.start_date ?? 'Inconnu', inline: true },
                { name: 'Fin', value: n.end_date ?? 'Inconnu', inline: true }
            )
            .setFooter({
                text: `Résultat ${index + 1}/${results.length} — MyAnimeList`,
                iconURL: interaction.user.avatarURL() || undefined
            })
            .setColor(0x2E51A2)
            .setTimestamp();
    };

    const message: Message = await interaction.editReply({
        embeds: [generateEmbed(results[index])],
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

        if (btn.customId === 'select') {
            collector.stop('selected');
            return btn.editReply({
                embeds: [generateEmbed(results[index])],
                components: []
            });
        }

        if (btn.customId === 'delete') {
            collector.stop('deleted');
            return interaction.deleteReply();
        }

        await btn.editReply({
            embeds: [generateEmbed(results[index])],
            components: [createPaginationControls(index, results.length)]
        });
    });

    collector.on('end', (_: ReadonlyCollection<string, ButtonInteraction>, reason: string): void => {
        if (reason !== 'selected') {
            interaction.editReply({ components: [] }).catch((): void => {});
        }
    });
}
