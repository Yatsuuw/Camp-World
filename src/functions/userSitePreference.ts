import { pool } from "../utils/database";

async function getUserSitePreference(userId: string): Promise<string> {
    try {
        const rows: any = await pool.query(
            `SELECT website FROM users WHERE user = ? LIMIT 1`,
            [userId]
        );

        if (Array.isArray(rows) && rows.length > 0) {
            const row = rows[0] as { website?: string };
            switch (row.website) {
                case '1':
                    return 'mal';
                case '2':
                    return 'anilist';
                default:
                    return 'mal';
            }
        }

        return 'mal';
    } catch (error) {
        console.error('Erreur getUserSitePreference : ', error);
        return 'mal';
    }
}

export default getUserSitePreference;