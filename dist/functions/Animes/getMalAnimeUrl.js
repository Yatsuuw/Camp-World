"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMalAnimeUrl = getMalAnimeUrl;
const axios_1 = __importDefault(require("axios"));
const handleErrorOptions_1 = require("../logs/handleErrorOptions");
async function getMalAnimeUrl(nameJa) {
    try {
        const base = process.env.MAL_API_BASE || '';
        const clientId = process.env.MAL_CLIENT_ID;
        if (!base || !clientId || !nameJa)
            return null;
        const url = `${base}/anime`;
        const response = await axios_1.default.get(url, {
            params: {
                q: nameJa,
                limit: 1,
                fields: 'id',
                nsfw: true
            },
            headers: { 'X-MAL-CLIENT-ID': clientId }
        });
        const node = response.data?.data?.[0]?.node;
        const id = node?.id;
        if (!id)
            return null;
        return `https://myanimelist.net/anime/${id}`;
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'getMalAnimeUrl',
            logMessage: `Une erreur est survenue lors de la récupération du lien vers l'animé "${nameJa}" sur MyAnimeList.`,
            includeStack: true
        });
        throw error;
    }
}
