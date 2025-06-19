import axios, { AxiosResponse } from 'axios';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    InteractionCollector,
    CacheType,
    InteractionResponse,
    ReadonlyCollection
} from 'discord.js';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';

async function fetchAuthorName(id: number): Promise<string> {
    const url = `https://myanimelist.net/people/${id}`;
    try {
        const { data: html } = await axios.get(url);
        const $: CheerioAPI = cheerio.load(html);
        let name: string = $('h1.title-name').first().text().trim();
        name = name.replace(',', '').replace(/\s+/g, ' ').trim();
        return name || 'Inconnu';
    } catch {
        return 'Inconnu';
    }
}

export default async function fetchMyAnimeListManga(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = `${process.env.MAL_API_BASE}/manga`;
    const params = {
        q: query,
        limit: 10,
        offset: 0,
        fields: [
            'id',
            'title',
            'main_picture',
            'genres',
            'mean',
            'rank',
            'popularity',
            'num_volumes',
            'num_chapters',
            'start_date',
            'end_date',
            'authors',
            'synopsis'
        ].join(',')
    };

    const response: AxiosResponse = await axios.get(url, {
        params,
        headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID || '' }
    });

    const results: any[] = response.data?.data ?? [];
    if (!results.length) {
        throw new Error('Aucun manga trouvé sur MyAnimeList.');
    }

    const authorLists: string[] = await Promise.all(
        results.map(async (item: any): Promise<string> => {
            const authorsRaw: any[] = item.node.authors ?? [];
            const names: string[] = await Promise.all(
                authorsRaw.map((a: any): Promise<string> => {
                    const id = a.node?.id;
                    return id ? fetchAuthorName(id) : Promise.resolve('Inconnu');
                })
            );
            const unique: string[] = Array.from(new Set(names.filter((n: string): boolean => n !== 'Inconnu')));
            return unique.length ? unique.join(', ') : 'Inconnu';
        })
    );

    let index: number = 0;

    const generateEmbed: (item: any, authors: string) => EmbedBuilder = (item: any, authors: string): EmbedBuilder => {
        const m: any = item.node;
        return new EmbedBuilder()
            .setTitle(m.title)
            .setURL(`https://myanimelist.net/manga/${m.id}`)
            .setImage(m.main_picture?.large ?? m.main_picture?.medium ?? null)
            .setDescription(m.synopsis ? m.synopsis.length > 1024 ? m.synopsis.substring(0, 1021) + '…' : m.synopsis : 'Synopsis non disponible.')
            .addFields(
                { name: 'Score moyen', value: m.mean?.toString() ?? 'Non noté', inline: true },
                { name: 'Classement global', value: m.rank ? `#${m.rank}` : 'Non classé', inline: true },
                { name: 'Popularité', value: m.popularity ? `#${m.popularity}` : 'Inconnue', inline: true },
                { name: 'Volumes', value: m.num_volumes?.toString() ?? 'Inconnu', inline: true },
                { name: 'Chapitres', value: m.num_chapters?.toString() ?? 'Inconnu', inline: true },
                { name: 'Genres', value: m.genres?.map((g: any): any => g.name).join(', ') || 'Non précisé', inline: false },
                { name: 'Auteur(s)', value: authors, inline: false },
                { name: 'Début publication', value: m.start_date ?? 'Inconnu', inline: true },
                { name: 'Fin publication', value: m.end_date ?? 'Inconnu', inline: true }
            )
            .setFooter({
                text: `Résultat ${index + 1}/${results.length} — MyAnimeList`,
                iconURL: interaction.user.avatarURL() || undefined
            })
            .setColor(0x2E51A2)
            .setTimestamp();
    };


    const controls: () => ActionRowBuilder<ButtonBuilder> = (): ActionRowBuilder<ButtonBuilder> =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('⬅️ Précédent')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(index === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('➡️ Suivant')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(index === results.length - 1),
            new ButtonBuilder()
                .setCustomId('select')
                .setLabel('✅ Sélectionner')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️ Supprimer')
                .setStyle(ButtonStyle.Danger)
        );

    const message: Message<boolean> = await interaction.editReply({
        embeds: [generateEmbed(results[index], authorLists[index])],
        components: [controls()]
    });

    const collector: InteractionCollector<ButtonInteraction<CacheType>> = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
    });

    collector.on('collect', async (btn: ButtonInteraction): Promise<void | Message<boolean> | InteractionResponse<boolean>> => {
        if (btn.user.id !== interaction.user.id) {
            return btn.reply({ content: '❌ Ce bouton n’est pas pour toi !', ephemeral: true });
        }
        await btn.deferUpdate();

        if (btn.customId === 'next' && index < results.length - 1) {
            index++;
        } else if (btn.customId === 'prev' && index > 0) {
            index--;
        }

        if (btn.customId === 'select') {
            collector.stop('selected');
            return btn.editReply({
                embeds: [generateEmbed(results[index], authorLists[index])],
                components: []
            });
        }

        if (btn.customId === 'delete') {
            collector.stop('deleted');
            return interaction.deleteReply();
        }

        await btn.editReply({
            embeds: [generateEmbed(results[index], authorLists[index])],
            components: [controls()]
        });
    });

    collector.on('end', (_: ReadonlyCollection<string, ButtonInteraction<CacheType>>, reason: string): void => {
        if (reason !== 'selected') {
            interaction.editReply({ components: [] }).catch((): void => {});
        }
    });
}
