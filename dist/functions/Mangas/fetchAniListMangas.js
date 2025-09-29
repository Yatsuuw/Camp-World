"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fetchAniListMangas;
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const setupPagination_1 = require("../../utils/pagination/setupPagination");
const fetchMalUrl_1 = require("../fetchMal/fetchMalUrl");
const handleErrorOptions_1 = require("../logs/handleErrorOptions");
const log_1 = require("../logs/log");
async function fetchAniListMangas(query, interaction) {
    try {
        const url = process.env.AL_API_BASE || '';
        if (!url) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, new Error('AL_API_BASE manquant'), {
                source: 'fetchAniListMangas',
                userMessage: '❌ Configuration invalide: service AniList indisponible.',
                logMessage: 'Variable AL_API_BASE absente ou vide',
                includeStack: false
            });
            return;
        }
        const query_api = `
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
        let response;
        try {
            response = await axios_1.default.post(url, { query: query_api, variables: { search: query, perPage: 10 } }, { headers: { "Content-Type": "application/json" } });
        }
        catch (apiErr) {
            const apiMessage = (0, log_1.extractAniListApiErrorMessage)(apiErr);
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, apiErr, {
                source: 'fetchAniListMangas',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur réseau AniList: réessayez plus tard.',
                logMessage: apiMessage ? `Appel AniList (manga) échoué - apiMessage: ${apiMessage}` : 'Appel AniList (manga) échoué',
                includeStack: true
            });
            return;
        }
        const results = response.data?.data?.Page?.media ?? [];
        if (!Array.isArray(results) || results.length === 0) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, new Error('Aucun résultat AniList'), {
                source: 'fetchAniListMangas',
                userMessage: `❌ Aucun manga trouvé pour “${query}”.`,
                logMessage: 'Aucun résultat AniList (manga)',
                includeStack: false
            });
            return;
        }
        const formatDate = (d) => d?.year ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "Inconnu";
        const stripHtmlTags = (text) => text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").trim();
        const strip = (str) => str ? stripHtmlTags(str).slice(0, 1021) + (str.length > 1024 ? "..." : "") : "Synopsis non disponible.";
        const generateEmbed = async (manga, index) => {
            const globalRankingEntry = manga.rankings.find((r) => r.allTime);
            const globalRank = globalRankingEntry ? `#${globalRankingEntry.rank}` : "Non classé";
            const alts = [
                ...(manga.synonyms || []),
                manga.title.english,
                manga.title.native,
            ]
                .filter((t) => !!t && ![manga.title.romaji].includes(t))
                .map((t) => t.trim());
            const humanRoles = ["author", "story", "art", "original creator", "mangaka"];
            const authors = Array.from(new Set((manga.staff?.edges || [])
                .filter((e) => e?.role && humanRoles.some((hr) => String(e.role).toLowerCase().includes(hr)))
                .map((e) => e?.node?.name?.full)));
            let malUrl = null;
            try {
                malUrl = await (0, fetchMalUrl_1.getMalUrl)('manga', manga.title?.native);
            }
            catch (mapErr) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, mapErr, {
                    source: 'fetchAniListMangas',
                    userMessage: 'ℹ️ Lien MAL indisponible pour ce résultat.',
                    logMessage: 'Résolution lien MAL (manga) échouée',
                    includeStack: false
                });
            }
            return new discord_js_1.EmbedBuilder()
                .setTitle(manga.title.english
                || manga.title.romaji
                || manga.title.native
                || "Titre inconnu")
                .setURL(manga.siteUrl)
                .setImage(manga.coverImage?.extraLarge ?? null)
                .setDescription(strip(manga.description))
                .addFields({ name: "Score moyen", value: manga.averageScore ? `${manga.averageScore}/100` : "Non noté", inline: true }, { name: "Classement global", value: globalRank ? `${globalRank}` : "Non classé", inline: true }, { name: "Popularité", value: manga.popularity ? `#${manga.popularity}` : "Inconnue", inline: true }, { name: "Chapitres", value: manga.chapters?.toString() ?? "Inconnu", inline: true }, { name: "Volumes", value: manga.volumes?.toString() ?? "Inconnu", inline: true }, { name: "Genres", value: (manga.genres || []).join(", ") || "Non précisé", inline: false }, { name: "Auteur(s)", value: authors.length ? authors.join(", ") : "Inconnu", inline: false }, { name: "Titres alternatifs", value: alts.length ? alts.join(" | ") : "Aucun", inline: false }, { name: "Début publication", value: formatDate(manga.startDate), inline: true }, { name: "Fin publication", value: formatDate(manga.endDate), inline: true }, { name: "Liens", value: `[AniList](${manga.siteUrl})${malUrl ? ` | [MyAnimeList](${malUrl})` : " | Ce manga est introuvable sur MyAnimeList"}`, inline: false })
                .setFooter({
                text: `Résultat ${index + 1}/${results.length}`,
                iconURL: interaction.user.avatarURL() || undefined
            })
                .setColor("#1da0f2")
                .setTimestamp();
        };
        try {
            await (0, setupPagination_1.setupPagination)(interaction, results, async (manga, index) => generateEmbed(manga, index));
        }
        catch (pErr) {
            const apiMessage = (0, log_1.extractAniListApiErrorMessage)(pErr);
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, pErr, {
                source: 'fetchAniListMangas',
                userMessage: apiMessage ? `❌ AniList: ${String(apiMessage).slice(0, 400)}` : '❌ Erreur d’affichage des résultats.',
                logMessage: apiMessage ? `Pagination (manga) échouée - apiMessage: ${apiMessage}` : 'Pagination (manga) échouée',
                includeStack: true
            });
        }
    }
    catch (error) {
        await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
            source: 'fetchAniListMangas',
            userMessage: '❌ Erreur lors de la recherche de mangas. Réessayez plus tard.',
            logMessage: 'Erreur inattendue dans fetchAniListMangas',
            includeStack: true
        });
        throw error;
    }
}
