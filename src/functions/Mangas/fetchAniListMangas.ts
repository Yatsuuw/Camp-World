import axios, { AxiosResponse } from "axios";
import {
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import { setupPagination } from "../../utils/pagination/setupPagination";
import { getMalUrl } from "../fetchMal/fetchMalUrl";
import { handleInteractionError } from "../logs/handleErrorOptions";
import {extractAniListApiErrorMessage, log} from "../logs/log";

export default async function fetchAniListMangas(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    try {
        const url: string = process.env.AL_API_BASE || '';
        if (!url) {
            await handleInteractionError(interaction, new Error('AL_API_BASE manquant'), {
                source: 'fetchAniListMangas',
                userMessage: '❌ Configuration invalide: service AniList indisponible.',
                logMessage: 'Variable AL_API_BASE absente ou vide',
                includeStack: false
            });
            return;
        }

        const query_api: string = `
            query ($search: String, $perPage: Int) {
                Page(perPage: $perPage) {
                    media(search: $search, type: MANGA) {
                        id
                        title { romaji english native }
                        synonyms
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

        let response: AxiosResponse<{ data: any }>;
        try {
            response = await axios.post<{ data: any }>(
                url,
                { query: query_api, variables: { search: query, perPage: 10 } },
                { headers: { "Content-Type": "application/json" } }
            );
        } catch (apiErr: unknown) {
            const apiMessage: string | undefined = extractAniListApiErrorMessage(apiErr);

            await handleInteractionError(interaction, apiErr, {
                source: 'fetchAniListMangas',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur réseau AniList: réessayez plus tard.',
                logMessage: apiMessage ? `Appel AniList (manga) échoué - apiMessage: ${apiMessage}` : 'Appel AniList (manga) échoué',
                includeStack: true
            });
            return;
        }

        const results: any[] = response.data?.data?.Page?.media ?? [];
        if (!Array.isArray(results) || results.length === 0) {
            await handleInteractionError(interaction, new Error('Aucun résultat AniList'), {
                source: 'fetchAniListMangas',
                userMessage: `❌ Aucun manga trouvé pour “${query}”.`,
                logMessage: 'Aucun résultat AniList (manga)',
                includeStack: false
            });
            return;
        }

        const formatDate: (d: any) => string = (d: any): string =>
            d?.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";

        const stripHtmlTags: (text: string) => string = (text: string): string =>
            text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();

        const strip: (str: string) => string = (str: string): string =>
            str ? stripHtmlTags(str).slice(0, 1021) + (str.length > 1024 ? "..." : "") : "Synopsis non disponible.";

        const generateEmbed: (manga: any, index: number) => Promise<EmbedBuilder> = async (manga: any, index: number): Promise<EmbedBuilder> => {
            const globalRankingEntry: any = manga.rankings.find((r: any): any => r.allTime);
            const globalRank: string = globalRankingEntry ? `#${globalRankingEntry.rank}` : "Non classé";

            const alts: string[] = [
                ...(manga.synonyms || []),
                manga.title.english,
                manga.title.native,
            ]
                .filter((t: string | undefined): boolean => !!t && ![manga.title.romaji].includes(t))
                .map((t: any): any => t!.trim());

            const humanRoles: string[] = ["author", "story", "art", "original creator", "mangaka"];
            const authors: unknown[] = Array.from(new Set(
                (manga.staff?.edges || [])
                    .filter((e: any): any => e?.role && humanRoles.some((hr: string): boolean => String(e.role).toLowerCase().includes(hr)))
                    .map((e: any): any => e?.node?.name?.full)
            ));

            let malUrl: string | null = null;
            try {
                log('debug', manga.title?.native, { source: 'fetchAniListMangas', includeStack: false });
                malUrl = await getMalUrl('manga', manga.title?.native);
                if (!malUrl) {
                    malUrl = await getMalUrl('manga', manga.title?.romaji);
                }
            } catch (mapErr: unknown) {
                await handleInteractionError(interaction, mapErr, {
                    source: 'fetchAniListMangas',
                    userMessage: 'ℹ️ Lien MAL indisponible pour ce résultat.',
                    logMessage: 'Résolution lien MAL (manga) échouée',
                    includeStack: false
                });
            }

            return new EmbedBuilder()
                .setTitle(
                    manga.title.english
                    || manga.title.romaji
                    || manga.title.native
                    || "Titre inconnu"
                )
                .setURL(manga.siteUrl)
                .setImage(manga.coverImage?.extraLarge ?? null)
                .setDescription(strip(manga.description))
                .addFields(
                    { name: "Score moyen", value: manga.averageScore ? `${manga.averageScore}/100` : "Non noté", inline: true },
                    { name: "Classement global", value: globalRank ? `${globalRank}` : "Non classé", inline: true },
                    { name: "Popularité", value: manga.popularity ? `#${manga.popularity}` : "Inconnue", inline: true },
                    { name: "Chapitres", value: manga.chapters?.toString() ?? "Inconnu", inline: true },
                    { name: "Volumes", value: manga.volumes?.toString() ?? "Inconnu", inline: true },
                    { name: "Genres", value: (manga.genres || []).join(", ") || "Non précisé", inline: false },
                    { name: "Auteur(s)", value: (authors as string[]).length ? (authors as string[]).join(", ") : "Inconnu", inline: false },
                    { name: "Titres alternatifs", value: alts.length ? alts.join(" | ") : "Aucun", inline: false },
                    { name: "Début publication", value: formatDate(manga.startDate), inline: true },
                    { name: "Fin publication", value: formatDate(manga.endDate), inline: true },
                    { name: "Liens", value: `[AniList](${manga.siteUrl})${malUrl ? ` | [MyAnimeList](${malUrl})` : " | Ce manga est introuvable sur MyAnimeList"}`, inline: false }
                )
                .setFooter({
                    text: `Résultat ${index + 1}/${results.length}`,
                    iconURL: interaction.user.avatarURL() || undefined
                })
                .setColor("#1da0f2")
                .setTimestamp();
        };

        try {
            await setupPagination(interaction, results, async (manga: any, index: number): Promise<EmbedBuilder> => generateEmbed(manga, index));
        } catch (pErr: unknown) {
            const apiMessage: string | undefined = extractAniListApiErrorMessage(pErr);

            await handleInteractionError(interaction, pErr, {
                source: 'fetchAniListMangas',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur d’affichage des résultats.',
                logMessage: apiMessage ? `Pagination (manga) échouée - apiMessage: ${apiMessage}` : 'Pagination (manga) échouée',
                includeStack: true
            });
        }
    } catch (error: unknown) {
        await handleInteractionError(interaction, error, {
            source: 'fetchAniListMangas',
            userMessage: '❌ Erreur lors de la recherche de mangas. Réessayez plus tard.',
            logMessage: 'Erreur inattendue dans fetchAniListMangas',
            includeStack: true
        });
        throw error;
    }
}