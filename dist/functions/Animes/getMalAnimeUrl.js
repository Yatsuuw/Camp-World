"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMalAnimeUrl = getMalAnimeUrl;
async function getMalAnimeUrl(nameJa) {
    return await fetchMalUrlIfMatches('anime', nameJa);
}
