import axios, { AxiosResponse } from "axios";
import { handleError } from "../logs/handleErrorOptions";
import {log} from "../logs/log";

export async function getMalUrl(kind: 'anime' | 'manga', nameJa: string | undefined | null): Promise<string | null> {
    try {
        const base: string = process.env.MAL_API_BASE || '';
        const clientId: string | undefined = process.env.MAL_CLIENT_ID;
        if (!base || !clientId || !nameJa) return null;

        const url = `${base}/${kind}`;
        const response: AxiosResponse = await axios.get(url, {
            params: {
                q: nameJa,
                limit: 1,
                fields: 'id',
                nsfw: true
            },
            headers: { 'X-MAL-CLIENT-ID': clientId }
        });

        log('debug', nameJa, { source: 'fetchMalUrl', includeStack: false });

        const node: any = response.data?.data?.[0]?.node;
        const id: number | string | undefined = node?.id;
        if (!id) return null;

        const japaneseTitle: string | null = node?.alternative_titles?.ja;
        if (!japaneseTitle) return null;

        log('debug', japaneseTitle, { source: 'fetchMalUrl', includeStack: false });

        if (nameJa === japaneseTitle) {
            return kind === 'anime' ? `https://myanimelist.net/anime/${id}` : `https://myanimelist.net/manga/${id}`;
        } else {
            return null;
        }
    } catch (error: unknown) {
        handleError(error, {
            source: 'fetchMalUrl',
            logMessage: `Erreur lors de la requête MyAnimeList (${kind}) pour "${nameJa}".`,
            includeStack: true
        });
        throw error;
    }
}
