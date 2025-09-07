"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServerInitialized = isServerInitialized;
const database_1 = require("../utils/database/database");
const handleErrorOptions_1 = require("./logs/handleErrorOptions");
async function isServerInitialized(serverId) {
    try {
        const rows = await database_1.pool.query('SELECT * FROM servers WHERE id = ?', [serverId]);
        return rows.length > 0;
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'isServerInitialized',
            logMessage: `Erreur lors de la vérification d'initialisation (serverId=${serverId})`,
            includeStack: true
        });
        throw error;
    }
}
