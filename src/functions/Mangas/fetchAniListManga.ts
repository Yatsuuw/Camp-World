import axios, {AxiosResponse} from "axios";
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
} from "discord.js";

function stripHtmlTags(text: string): string {
    return text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();
}

export default async function fetchAniListManga(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const url = process.env.AL_API_BASE || "";
    const query_api = `
    query ($search: String, $perPage: Int) {
      Page(perPage: $perPage) {
        media(search: $search, type: MANGA) {
          id
          title { romaji english native }
          description(asHtml: false)
          chapters
          volumes
          averageScore
          popularity
          rankings { rank type allTime }
          genres
          startDate { year month day }
          endDate   { year month day }
          coverImage { extraLarge }
          siteUrl
          staff(sort: ROLE) {
            edges { role node { name { full } } }
          }
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
        throw new Error("Aucun manga trouvé sur AniList.");
    }

    let index: number = 0;

    const formatDate: (d: any) => string = (d: any): string =>
        d?.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";

    const strip: (str: string) => string = (str: string): string =>
        str ? stripHtmlTags(str).slice(0, 1021) + (str.length > 1024 ? "..." : "") : "Synopsis non disponible.";

    const generateEmbed: (manga: any) => EmbedBuilder = (manga: any): EmbedBuilder => {
        const globalRank: any = manga.rankings?.find((r: any): any => r.allTime)?.rank;

        const humanRoles: string[] = ["author", "story", "art", "original creator", "mangaka"];
        const authors: unknown[] = Array.from(new Set(
            (manga.staff.edges || [])
                .filter((e: any): any => e.role && humanRoles.some((hr: string): string => e.role.toLowerCase().includes(hr)))
                .map((e: any): any => e.node.name.full)
        ));

        return new EmbedBuilder()
            .setTitle(
                manga.title.english
                || manga.title.romaji
                || manga.title.native
                || "Titre inconnu"
            )
            .setURL(manga.siteUrl)
            .setImage(manga.coverImage.extraLarge )
            .setDescription(strip(manga.description))
            .addFields(
                { name: "Score moyen", value: manga.averageScore ? `${manga.averageScore}/100` : "Non noté", inline: true },
                { name: "Classement global", value: globalRank ? `#${globalRank}` : "Non classé", inline: true },
                { name: "Popularité", value: manga.popularity ? `#${manga.popularity}` : "Inconnue", inline: true },
                { name: "Chapitres", value: manga.chapters?.toString() ?? "Inconnu", inline: true },
                { name: "Volumes", value: manga.volumes?.toString() ?? "Inconnu", inline: true },
                { name: "Genres", value: manga.genres.join(", ") || "Non précisé", inline: false },
                { name: "Auteur(s)", value: authors.length ? authors.join(", ") : "Inconnu", inline: false },
                { name: "Début publication", value: formatDate(manga.startDate), inline: true },
                { name: "Fin publication", value: formatDate(manga.endDate), inline: true }
            )
            .setFooter({
                text: `Résultat ${index + 1}/${results.length} — AniList`,
                iconURL: interaction.user.avatarURL() || undefined
            })
            .setColor(0x2E51A2)
            .setTimestamp();
    };


    const controls: () => ActionRowBuilder<ButtonBuilder> = (): ActionRowBuilder<ButtonBuilder> =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("prev")
                .setLabel("⬅️ Précédent")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(index === 0),
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel("➡️ Suivant")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(index === results.length - 1),
            new ButtonBuilder()
                .setCustomId("select")
                .setLabel("✅ Sélectionner")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("delete")
                .setLabel("🗑️ Supprimer")
                .setStyle(ButtonStyle.Danger)
        );

    const message: Message<boolean> = await interaction.editReply({
        embeds: [generateEmbed(results[index])],
        components: [controls()]
    });

    const collector: InteractionCollector<ButtonInteraction<CacheType>> = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
    });

    collector.on("collect", async (btn: ButtonInteraction): Promise<void | Message<boolean> | InteractionResponse<boolean>> => {
        if (btn.user.id !== interaction.user.id) {
            return btn.reply({ content: "❌ Ce bouton n’est pas pour toi !", ephemeral: true });
        }
        await btn.deferUpdate();

        if (btn.customId === "next" && index < results.length - 1) {
            index++;
        } else if (btn.customId === "prev" && index > 0) {
            index--;
        }

        if (btn.customId === "select") {
            collector.stop("selected");
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
            components: [controls()]
        });
    });

    collector.on("end", (_: ReadonlyCollection<string, ButtonInteraction<CacheType>>, reason: string): void => {
        if (reason !== "selected") {
            interaction.editReply({ components: [] }).catch((): void => {});
        }
    });
}
