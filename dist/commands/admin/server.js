"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const database_1 = require("../../utils/database/database");
const isServerInitialized_1 = require("../../functions/isServerInitialized");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
const log_1 = require("../../functions/logs/log");
const serverCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('server')
        .setDescription('Gérez le statut de votre serveur dans la base de données.')
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Action à effectuer sur votre serveur dans la base de données')
        .addChoices({ name: 'Initialiser', value: 'init' }, { name: 'Supprimer', value: 'delete' })
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .setContexts(0),
    async execute(interaction) {
        const serverId = interaction.guild?.id || '';
        const ownerId = interaction.guild?.ownerId || '';
        const guildName = interaction.guild?.name || '';
        const action = interaction.options.getString('action', true);
        if (!serverId) {
            await (0, reply_1.safeReply)(interaction, 'Impossible de déterminer le serveur.', 'server');
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec hors serveur`, { source: 'server', includeStack: false });
            return;
        }
        try {
            const initialized = await (0, isServerInitialized_1.isServerInitialized)(serverId);
            if (action === 'init') {
                if (initialized) {
                    await (0, reply_1.safeReply)(interaction, "Ce serveur est déjà initialisé dans la base de données.", 'server');
                    return;
                }
                try {
                    await database_1.pool.query('INSERT INTO servers (id, owner) VALUES (?, ?)', [serverId, ownerId]);
                    await (0, reply_1.safeReply)(interaction, `Serveur ${guildName} initialisé avec succès.`, 'server');
                }
                catch (dbErr) {
                    await (0, handleErrorOptions_1.handleInteractionError)(interaction, dbErr, {
                        source: 'server',
                        userMessage: "❌ Erreur DB: impossible d'initialiser le serveur pour le moment.",
                        logMessage: `INSERT servers échoué (id=${serverId}, owner=${ownerId})`,
                        includeStack: true
                    });
                    return;
                }
                return;
            }
            if (!initialized) {
                await (0, reply_1.safeReply)(interaction, "Ce serveur n'est pas initialisé.", 'server');
                return;
            }
            try {
                await database_1.pool.query('DELETE FROM servers WHERE id = ? AND owner = ?', [serverId, ownerId]);
                await (0, reply_1.safeReply)(interaction, `Serveur ${guildName} supprimé avec succès.`, 'server');
            }
            catch (dbErr) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, dbErr, {
                    source: 'server',
                    userMessage: '❌ Erreur DB: impossible de supprimer ce serveur pour le moment.',
                    logMessage: `DELETE servers échoué (id=${serverId}, owner=${ownerId})`,
                    includeStack: true
                });
                return;
            }
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - ${action} - ${guildName} - Réussite en serveur`, { source: 'server', includeStack: false });
        }
        catch (err) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, err, {
                source: 'server',
                userMessage: '❌ Erreur inattendue. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /server',
                includeStack: true
            });
            return;
        }
    }
};
exports.default = serverCommand;
