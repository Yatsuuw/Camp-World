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
                fields: 'id,title,alternative_titles',
                nsfw: true
            },
            headers: { 'X-MAL-CLIENT-ID': clientId }
        });
        const node = response.data?.data?.[0]?.node;
        const id = node?.id;
        if (!id)
            return null;
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
        if (!normInput)
            return null;
        const malTitlesToCompare = [
            node?.alternative_titles?.ja,
            node?.title,
        ];
        if (malTitlesToCompare.some(title => normalize(title) === normInput)) {
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
