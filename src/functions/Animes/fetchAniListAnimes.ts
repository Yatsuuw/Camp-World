import axios, {AxiosResponse} from "axios";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    Message,
    InteractionCollector,
    InteractionResponse,
    ReadonlyCollection
} from "discord.js";
import {createPaginationControls} from "../../utils/pagination/paginationControls";
import {handlePaginationButton} from "../../utils/pagination/handlePaginationButton";

export default async function fetchAniListAnimes(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = process.env.AL_API_BASE || "";
    const query_api = `
    query ($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          synonyms
          status
          popularity
          source
          favourites
          averageScore
          description(asHtml: false)
          episodes
          duration
          genres
          startDate { year month day }
          endDate { year month day }
          coverImage { extraLarge }
          studios { nodes { name isAnimationStudio } }
          rankings {
            rank
            type
            allTime
          }
          siteUrl
        }
      }
    }
  `;

    const response: AxiosResponse = await axios.post<{ data: any }>(
        url,
        { query: query_api, variables: { search: query, perPage: 10 } },
        { headers: { "Content-Type": "application/json" } }
    );

    const results: any[] = response.data.data.Page.media;
    if (!results.length) {
        throw new Error("Aucun animé trouvé sur AniList.");
    }

    let index: number = 0;

    const formatDate: (d: any) => string = (d: any): string =>
        d.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";

    const strip: (str: string) => string = (str: string): string =>
        str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();

    const generateEmbed: (anime: any) => EmbedBuilder = (anime: any): EmbedBuilder => {
        const studios: unknown[] = Array.from(
            new Set(
                anime.studios.nodes
                    .filter((s: any): any => s.isAnimationStudio)
                    .map((s: any): any => s.name)
            )
        );

        const globalRankingEntry: any = anime.rankings.find((r: any): any => r.allTime);
        const globalRank: string = globalRankingEntry ? `#${globalRankingEntry.rank}` : "Non classé";

        const alts: string[] = [
            ...(anime.synonyms || []),
            anime.title.english,
            anime.title.native,
        ]
            .filter((t: string | undefined): boolean => !!t && ![anime.title.romaji].includes(t))
            .map((t: any): any => t!.trim());

        const desc: string = anime.description
            ? strip(anime.description).slice(0, 1021) + (anime.description.length > 1024 ? "…" : "")
            : "Synopsis non disponible.";

        return new EmbedBuilder()
            .setTitle(anime.title.english || anime.title.romaji || anime.title.native || "Titre inconnu")
            .setURL(anime.siteUrl)
            .setImage(anime.coverImage.extraLarge)
            .setDescription(desc)
            .addFields(
                { name: "Statut", value: anime.status || "Inconnu", inline: true },
                { name: "Popularité", value: anime.popularity ? `#${anime.popularity}` : "Inconnue", inline: true },
                { name: "Classement global", value: globalRank, inline: true },
                { name: "Source", value: anime.source || "Inconnue", inline: true },
                { name: "Favoris", value: anime.favourites?.toString() || "0", inline: true },
                { name: "Score moyen", value: anime.averageScore?.toString() || "Non noté", inline: true },
                { name: "Épisodes", value: anime.episodes?.toString()     || "Inconnu", inline: true },
                { name: "Durée/épisode", value: anime.duration ? `${anime.duration} min` : "Inconnue", inline: true },
                { name: "Genres", value: anime.genres.join(", ") || "Non précisé", inline: false },
                { name: "Studios", value: studios.length ? studios.join(", ") : "Inconnu", inline: false },
                { name: "Titres alternatifs", value: alts.length ? alts.join(" | ") : "Aucun", inline: false },
                { name: "Début", value: formatDate(anime.startDate), inline: true },
                { name: "Fin", value: formatDate(anime.endDate), inline: true }
            )
            .setFooter({ text: `Résultat ${index + 1}/${results.length} — AniList`, iconURL: interaction.user.avatarURL() ?? undefined })
            .setColor(0x00ccbc)
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

    collector.on("collect", async (btn: ButtonInteraction): Promise<void | Message | InteractionResponse> => {
        const newIndexAnimes: number | null = await handlePaginationButton(btn, interaction.user.id, index, results.length);
        if (newIndexAnimes === null) return;
        index = newIndexAnimes;

        if (btn.customId === "select") {
            collector.stop("selected");
            return btn.editReply({
                embeds: [generateEmbed(results[index])],
                components: []
            });
        }

        if (btn.customId === "delete") {
            collector.stop("deleted");
            return await interaction.deleteReply();
        }

        await btn.editReply({
            embeds: [generateEmbed(results[index])],
            components: [createPaginationControls(index, results.length)]
        });
    });

    collector.on("end", (_: ReadonlyCollection<string, ButtonInteraction>, reason: string): void => {
        if (reason !== "selected") {
            interaction.editReply({ components: [] }).catch((): void => {});
        }
    });
}
