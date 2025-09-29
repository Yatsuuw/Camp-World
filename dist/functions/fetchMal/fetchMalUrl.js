"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMalUrl = getMalUrl;
const axios_1 = __importDefault(require("axios"));
const handleErrorOptions_1 = require("../logs/handleErrorOptions");
async function getMalUrl(kind, nameJa) {
    try {
        const base = process.env.MAL_API_BASE || '';
        const clientId = process.env.MAL_CLIENT_ID;
        if (!base || !clientId || !nameJa)
            return null;
        const url = `${base}/${kind}`;
        const response = await axios_1.default.get(url, {
            params: {
                q: nameJa,
                limit: 1,
                fields: 'id,title',
                nsfw: true
            },
            headers: { 'X-MAL-CLIENT-ID': clientId }
        });
        const node = response.data?.data?.[0]?.node;
        const id = node?.id;
        if (!id)
            return null;
        let malTitle;
        try {
            malTitle = node?.title ?? node?.title?.native ?? node?.title?.romaji ?? node?.title?.english ?? undefined;
            if (typeof malTitle !== 'string')
                malTitle = undefined;
        }
        catch {
            malTitle = undefined;
        }
        const normalize = (s) => {
            if (!s)
                return null;
            try {
                return String(s).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
            }
            catch {
                return String(s).trim().toLowerCase();
            }
        };
        const normInput = normalize(nameJa);
        const normMal = normalize(malTitle);
        if (normInput && normMal && normInput === normMal) {
            return kind === 'anime' ? `https://myanimelist.net/anime/${id}` : `https://myanimelist.net/manga/${id}`;
        }
        return null;
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'fetchMalUrl',
            logMessage: `Erreur lors de la requête MyAnimeList (${kind}) pour "${nameJa}".`,
            includeStack: true
        });
        throw error;
    }
}
