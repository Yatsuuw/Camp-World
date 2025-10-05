"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fetchAniListAnimes;
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const setupPagination_1 = require("../../utils/pagination/setupPagination");
const fetchMalUrl_1 = require("../fetchMal/fetchMalUrl");
const handleErrorOptions_1 = require("../logs/handleErrorOptions");
const log_1 = require("../logs/log");
async function fetchAniListAnimes(query, interaction) {
    try {
        const url = process.env.AL_API_BASE || '';
        if (!url) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, new Error('AL_API_BASE manquant'), {
                source: 'fetchAniListAnimes',
                userMessage: '❌ Configuration invalide: service AniList indisponible.',
                logMessage: 'Variable AL_API_BASE absente ou vide',
                includeStack: false
            });
            return;
        }
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
        let response;
        try {
            response = await axios_1.default.post(url, { query: query_api, variables: { search: query, perPage: 10 } }, { headers: { "Content-Type": "application/json" } });
        }
        catch (apiErr) {
            const apiMessage = (0, log_1.extractAniListApiErrorMessage)(apiErr);
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, apiErr, {
                source: 'fetchAniListAnimes',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur réseau AniList: réessayez plus tard.',
                logMessage: apiMessage ? `Appel AniList (anime) échoué - apiMessage: ${apiMessage}` : 'Appel AniList (anime) échoué',
                includeStack: true
            });
            return;
        }
        const results = response.data?.data?.Page?.media ?? [];
        if (!Array.isArray(results) || results.length === 0) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, new Error('Aucun résultat AniList'), {
                source: 'fetchAniListAnimes',
                userMessage: `❌ Aucun animé trouvé pour “${query}”.`,
                logMessage: 'Aucun résultat AniList (anime)',
                includeStack: false
            });
            return;
        }
        const formatDate = (d) => d?.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";
        const strip = (str) => str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();
        const generateEmbed = async (anime, index) => {
            const studios = Array.from(new Set((anime.studios?.nodes || [])
                .filter((s) => Boolean(s?.isAnimationStudio))
                .map((s) => s?.name)));
            const globalRankingEntry = (anime.rankings || []).find((r) => Boolean(r?.allTime));
            const globalRank = globalRankingEntry ? `#${globalRankingEntry.rank}` : "Non classé";
            const alts = [
                ...(anime.synonyms || []),
                anime.title?.english,
                anime.title?.native,
            ]
                .filter((t) => !!t && ![anime.title?.romaji].includes(t))
                .map((t) => String(t).trim());
            const descRaw = anime.description ? strip(anime.description) : "Synopsis non disponible.";
            const desc = descRaw.length > 1024 ? (descRaw.slice(0, 1021) + "...") : descRaw;
            let malUrl = null;
            try {
                malUrl = await (0, fetchMalUrl_1.getMalUrl)('anime', anime.title?.native);
            }
            catch (mapErr) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, mapErr, {
                    source: 'fetchAniListAnimes',
                    userMessage: 'ℹ️ Lien MAL indisponible pour ce résultat.',
                    logMessage: 'Résolution lien MAL (anime) échouée',
                    includeStack: false
                });
            }
            return new discord_js_1.EmbedBuilder()
                .setTitle(anime.title?.english || anime.title?.romaji || anime.title?.native || "Titre inconnu")
                .setURL(anime.siteUrl)
                .setImage(anime.coverImage?.extraLarge ?? null)
                .setDescription(desc)
                .addFields({ name: "Statut", value: anime.status || "Inconnu", inline: true }, { name: "Popularité", value: anime.popularity ? `#${anime.popularity}` : "Inconnue", inline: true }, { name: "Classement global", value: globalRank, inline: true }, { name: "Source", value: anime.source || "Inconnue", inline: true }, { name: "Favoris", value: anime.favourites?.toString() || "0", inline: true }, { name: "Score moyen", value: anime.averageScore?.toString() || "Non noté", inline: true }, { name: "Épisodes", value: anime.episodes?.toString() || "Inconnu", inline: true }, { name: "Durée/épisode", value: anime.duration ? `${anime.duration} min` : "Inconnue", inline: true }, { name: "Genres", value: (anime.genres || []).join(", ") || "Non précisé", inline: false }, { name: "Studios", value: studios.length ? studios.join(", ") : "Inconnu", inline: false }, { name: "Titres alternatifs", value: alts.length ? alts.join(" | ") : "Aucun", inline: false }, { name: "Début", value: formatDate(anime.startDate), inline: true }, { name: "Fin", value: formatDate(anime.endDate), inline: true }, { name: "Liens", value: `[AniList](${anime.siteUrl})${malUrl ? ` | [MyAnimeList](${malUrl})` : " | Cet animé est introuvable sur MyAnimeList"}`, inline: false })
                .setFooter({ text: `Résultat ${index + 1}/${results.length}`, iconURL: interaction.user.avatarURL() ?? undefined })
                .setColor("#1da0f2")
                .setTimestamp();
        };
        try {
            await (0, setupPagination_1.setupPagination)(interaction, results, async (anime, index) => generateEmbed(anime, index));
        }
        catch (pErr) {
            const apiMessage = (0, log_1.extractAniListApiErrorMessage)(pErr);
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, pErr, {
                source: 'fetchAniListAnimes',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur d’affichage des résultats.',
                logMessage: apiMessage ? `Pagination (anime) échouée - apiMessage: ${apiMessage}` : 'Pagination (anime) échouée',
                includeStack: true
            });
        }
    }
    catch (error) {
        await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
            source: 'fetchAniListAnimes',
            userMessage: '❌ Erreur lors de la recherche d’animés. Réessayez plus tard.',
            logMessage: 'Erreur inattendue dans fetchAniListAnimes',
            includeStack: true
        });
        throw error;
    }
}
