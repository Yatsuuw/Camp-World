"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMalMangaUrl = getMalMangaUrl;
const fetchMalUrlIfMatches_1 = require("../mal/fetchMalUrlIfMatches");
async function getMalMangaUrl(nameJa) {
    return await (0, fetchMalUrlIfMatches_1.fetchMalUrlIfMatches)('manga', nameJa);
}
