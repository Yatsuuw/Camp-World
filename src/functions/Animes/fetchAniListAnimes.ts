import axios, { AxiosResponse } from "axios";
import {
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import { setupPagination } from "../../utils/pagination/setupPagination";
import { getMalUrl } from "../fetchMal/fetchMalUrl";
import { handleInteractionError } from "../logs/handleErrorOptions";
import { extractAniListApiErrorMessage, log } from "../logs/log";

export default async function fetchAniListAnimes(
    query: string,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    try {
        const url: string = process.env.AL_API_BASE || '';
        if (!url) {
            await handleInteractionError(interaction, new Error('AL_API_BASE manquant'), {
                source: 'fetchAniListAnimes',
                userMessage: '❌ Configuration invalide: service AniList indisponible.',
                logMessage: 'Variable AL_API_BASE absente ou vide',
                includeStack: false
            });
            return;
        }

        const query_api: string = `
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
                source: 'fetchAniListAnimes',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur réseau AniList: réessayez plus tard.',
                logMessage: apiMessage ? `Appel AniList (anime) échoué - apiMessage: ${apiMessage}` : 'Appel AniList (anime) échoué',
                includeStack: true
            });
            return;
        }

        const results: any[] = response.data?.data?.Page?.media ?? [];
        if (!Array.isArray(results) || results.length === 0) {
            await handleInteractionError(interaction, new Error('Aucun résultat AniList'), {
                source: 'fetchAniListAnimes',
                userMessage: `❌ Aucun animé trouvé pour “${query}”.`,
                logMessage: 'Aucun résultat AniList (anime)',
                includeStack: false
            });
            return;
        }

        const formatDate: (d: any) => string = (d: any): string =>
            d?.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";

        const strip: (str: string) => string = (str: string): string =>
            str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();

        const generateEmbed: (anime: any, index: number) => Promise<EmbedBuilder> = async (anime: any, index: number): Promise<EmbedBuilder> => {
            const studios: unknown[] = Array.from(
                new Set(
                    (anime.studios?.nodes || [])
                        .filter((s: any): boolean => Boolean(s?.isAnimationStudio))
                        .map((s: any): any => s?.name)
                )
            );

            const globalRankingEntry: any = (anime.rankings || []).find((r: any): boolean => Boolean(r?.allTime));
            const globalRank: string = globalRankingEntry ? `#${globalRankingEntry.rank}` : "Non classé";

            const alts: string[] = [
                ...(anime.synonyms || []),
                anime.title?.english,
                anime.title?.native,
            ]
                .filter((t: string | undefined): boolean => !!t && ![anime.title?.romaji].includes(t))
                .map((t: any): string => String(t).trim());

            const descRaw: string = anime.description ? strip(anime.description) : "Synopsis non disponible.";
            const desc: string = descRaw.length > 1024 ? (descRaw.slice(0, 1021) + "...") : descRaw;

            let malUrl: string | null = null;
            try {
                log('debug', anime.title.native, { source: 'fetchAniListAnimes', includeStack: false });
                malUrl = await getMalUrl('anime', anime.title?.native);
                if (!malUrl) {
                    malUrl = await getMalUrl('manga', anime.title?.romaji);
                }
            } catch (mapErr: unknown) {
                await handleInteractionError(interaction, mapErr, {
                    source: 'fetchAniListAnimes',
                    userMessage: 'ℹ️ Lien MAL indisponible pour ce résultat.',
                    logMessage: 'Résolution lien MAL (anime) échouée',
                    includeStack: false
                });
            }

            return new EmbedBuilder()
                .setTitle(anime.title?.english || anime.title?.romaji || anime.title?.native || "Titre inconnu")
                .setURL(anime.siteUrl)
                .setImage(anime.coverImage?.extraLarge ?? null)
                .setDescription(desc)
                .addFields(
                    { name: "Statut", value: anime.status || "Inconnu", inline: true },
                    { name: "Popularité", value: anime.popularity ? `#${anime.popularity}` : "Inconnue", inline: true },
                    { name: "Classement global", value: globalRank, inline: true },
                    { name: "Source", value: anime.source || "Inconnue", inline: true },
                    { name: "Favoris", value: anime.favourites?.toString() || "0", inline: true },
                    { name: "Score moyen", value: anime.averageScore?.toString() || "Non noté", inline: true },
                    { name: "Épisodes", value: anime.episodes?.toString() || "Inconnu", inline: true },
                    { name: "Durée/épisode", value: anime.duration ? `${anime.duration} min` : "Inconnue", inline: true },
                    { name: "Genres", value: (anime.genres || []).join(", ") || "Non précisé", inline: false },
                    { name: "Studios", value: studios.length ? (studios as string[]).join(", ") : "Inconnu", inline: false },
                    { name: "Titres alternatifs", value: alts.length ? alts.join(" | ") : "Aucun", inline: false },
                    { name: "Début", value: formatDate(anime.startDate), inline: true },
                    { name: "Fin", value: formatDate(anime.endDate), inline: true },
                    { name: "Liens", value: `[AniList](${anime.siteUrl})${malUrl ? ` | [MyAnimeList](${malUrl})` : " | Cet animé est introuvable sur MyAnimeList"}`, inline: false }
                )
                .setFooter({ text: `Résultat ${index + 1}/${results.length}`, iconURL: interaction.user.avatarURL() ?? undefined })
                .setColor("#1da0f2")
                .setTimestamp();
        };

        try {
            await setupPagination(interaction, results, async (anime: any, index: number): Promise<EmbedBuilder> => generateEmbed(anime, index));
        } catch (pErr: unknown) {
            const apiMessage: string | undefined = extractAniListApiErrorMessage(pErr);

            await handleInteractionError(interaction, pErr, {
                source: 'fetchAniListAnimes',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur d’affichage des résultats.',
                logMessage: apiMessage ? `Pagination (anime) échouée - apiMessage: ${apiMessage}` : 'Pagination (anime) échouée',
                includeStack: true
            });
        }
    } catch (error: unknown) {
        await handleInteractionError(interaction, error, {
            source: 'fetchAniListAnimes',
            userMessage: '❌ Erreur lors de la recherche d’animés. Réessayez plus tard.',
            logMessage: 'Erreur inattendue dans fetchAniListAnimes',
            includeStack: true
        });
        throw error;
    }
}
