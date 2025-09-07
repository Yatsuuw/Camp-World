"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.getConnection = getConnection;
exports.testDatabaseConnection = testDatabaseConnection;
const mariadb_1 = __importDefault(require("mariadb"));
const dotenv = __importStar(require("dotenv"));
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
dotenv.config();
exports.pool = mariadb_1.default.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});
async function getConnection() {
    return await exports.pool.getConnection();
}
async function testDatabaseConnection() {
    let conn;
    try {
        conn = await getConnection();
        await conn.query('SELECT 1');
        return true;
    }
    catch (error) {
        (0, handleErrorOptions_1.handleError)(error, {
            source: 'database',
            logMessage: 'Échec de la connexion au pool MariaDB.',
            includeStack: true,
        });
        throw error;
    }
    finally {
        if (conn) {
            try {
                await conn.release();
            }
            catch (releaseError) {
                (0, handleErrorOptions_1.handleError)(releaseError, {
                    source: 'database',
                    logMessage: 'Impossible de libérer la connexion MariaDB.',
                    includeStack: true,
                });
            }
        }
    }
}
