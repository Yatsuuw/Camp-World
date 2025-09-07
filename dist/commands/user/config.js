"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const database_1 = require("../../utils/database/database");
const isServerInitialized_1 = require("../../functions/isServerInitialized");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
const log_1 = require("../../functions/logs/log");
function toColumn(type) {
    switch (type) {
        case 'mal':
            return 'mal_username';
        case 'al':
            return 'al_username';
        case 'mangacollec':
            return 'mangacollec';
    }
}
function toWebsiteLabel(type) {
    switch (type) {
        case 'mal':
            return 'MyAnimeList';
        case 'al':
            return 'AniList';
        case 'mangacollec':
            return 'MangaCollec';
    }
}
function sanitizeInput(input) {
    const val = (input ?? '').trim();
    return val.slice(0, 64);
}
async function upsertUserField(params) {
    const { userId, column, value } = params;
    const safeColumn = column;
    const sql = `
        INSERT INTO users (\`user\`, \`${safeColumn}\`)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE \`${safeColumn}\` = VALUES(\`${safeColumn}\`)
    `;
    await database_1.pool.query(sql, [userId, value]);
}
const configCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('config_profil')
        .setDescription('Configurez votre profil MyAnimeList, AniList ou votre identifiant MangaCollec.')
        .addStringOption((option) => option
        .setName('type')
        .setDescription('Choisissez la plateforme à configurer.')
        .addChoices({ name: 'MyAnimeList', value: 'mal' }, { name: 'AniList', value: 'al' }, { name: 'MangaCollec', value: 'mangacollec' })
        .setRequired(true))
        .addStringOption((option) => option
        .setName('nom')
        .setDescription('Votre identifiant / nom de profil sur la plateforme choisie.')
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        try {
            if (interaction.guild) {
                const ok = await (0, isServerInitialized_1.isServerInitialized)(interaction.guild.id);
                if (!ok) {
                    await (0, reply_1.safeReply)(interaction, "Ce serveur n'est pas initialisé dans la base de données. Contactez un administrateur.", 'config');
                    (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'config_profil', includeStack: false });
                    return;
                }
            }
            const userId = interaction.user.id;
            const typeOpt = interaction.options.getString('type', true);
            const type = typeOpt;
            const rawName = interaction.options.getString('nom', true);
            const username = sanitizeInput(rawName);
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${username} - Réussite en serveur`, { source: 'config_profil', includeStack: false });
            if (!username) {
                await (0, reply_1.safeReply)(interaction, "Nom invalide: veuillez fournir un identifiant non vide.", 'config');
                return;
            }
            try {
                const column = toColumn(type);
                await upsertUserField({ userId, column, value: username });
            }
            catch (dbErr) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, dbErr, {
                    source: 'config',
                    userMessage: "Erreur base de données: impossible d'enregistrer votre configuration pour le moment.",
                    logMessage: `Erreur DB lors de l'upsert du profil (user=${userId})`,
                    includeStack: true
                });
                return;
            }
            const website = toWebsiteLabel(type);
            await (0, reply_1.safeReply)(interaction, `Votre configuration ${website} a été mise à jour.`, 'config');
        }
        catch (err) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, err, {
                source: 'config',
                userMessage: "Une erreur imprévue est survenue. Réessayez plus tard.",
                logMessage: 'Erreur inattendue dans config_profil',
                includeStack: true
            });
            return;
        }
    }
};
exports.default = configCommand;
