"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const child_process_1 = require("child_process");
const isServerInitialized_1 = require("../../functions/isServerInitialized");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
const database_1 = require("../../utils/database/database");
const log_1 = require("../../functions/logs/log");
const statusCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('status')
        .setDescription('Affiche et modifie le statut du robot.')
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Effectue une action directe sur le robot.')
        .addChoices({ name: 'Redémarrer', value: 'restart' }, { name: 'Test de connexion à la base de données', value: 'dbTest' }, { name: 'Déployer les commandes dans l\'API', value: 'deploy' })
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        try {
            if (interaction.guild) {
                const initialized = await (0, isServerInitialized_1.isServerInitialized)(interaction.guild.id);
                if (!initialized) {
                    await (0, reply_1.safeReply)(interaction, "Le serveur n'est pas initialisé dans la base de données. Veuillez contacter un administrateur.", 'status');
                    (0, log_1.log)('error', `${interaction.user.globalName} (${interaction.user.id}) - Échec hors serveur`, { source: 'status', includeStack: false });
                    return;
                }
            }
            const action = interaction.options.getString('action', true);
            const location = interaction.guild ? 'serveur' : 'messages privés';
            await interaction.deferReply({ flags: 64 });
            if (interaction.user.id !== process.env.OWNER_ID) {
                await (0, reply_1.safeReply)(interaction, "Seule la propriétaire du robot a la permission d'exécuter cette commande.", 'status');
                return;
            }
            switch (action) {
                case 'restart': {
                    await interaction.editReply(`🔄✅ Redémarrage terminé.\n→ Nombre de serveurs : ${client.guilds.cache.size}`);
                    (0, log_1.log)('error', `Redémarrage demandé par ${interaction.user.tag}`, { source: 'status', includeStack: true });
                    setTimeout(() => process.exit(0), 1000);
                    break;
                }
                case 'dbTest': {
                    const dbOk = await (0, database_1.testDatabaseConnection)();
                    if (!dbOk) {
                        await interaction.editReply({
                            content: '❌ Le test de connexion à la base de données a échoué.'
                        });
                    }
                    else {
                        await interaction.editReply({
                            content: '✅ Le test de connexion à la base de données a réussi.'
                        });
                    }
                    break;
                }
                case 'deploy': {
                    (0, child_process_1.exec)('node dist/deploy-commands.js', async (error, stdout, stderr) => {
                        if (error) {
                            await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
                                source: 'status',
                                userMessage: `❌ Erreur de déploiement : ${error.message}`,
                                logMessage: 'Erreur lors du déploiement des commandes',
                                includeStack: true
                            });
                            return;
                        }
                        if (stderr) {
                            (0, log_1.log)('error', `[deploy:stderr] ${stderr}`, { source: 'status', includeStack: true });
                        }
                        (0, log_1.log)('info', `[deploy:stdout] ${stdout}`, { source: 'status', includeStack: true });
                        try {
                            await interaction.editReply({
                                content: `✅ Déploiement terminé.\n\`\`\`\n${stdout}\n\`\`\``
                            });
                        }
                        catch (notifyErr) {
                            await (0, handleErrorOptions_1.handleInteractionError)(interaction, notifyErr, {
                                source: 'status',
                                userMessage: '❌ Impossible d\'envoyer le résultat du déploiement.',
                                logMessage: 'Echec interaction.editReply après déploiement',
                                includeStack: true
                            });
                            return;
                        }
                    });
                    break;
                }
                default:
                    await (0, reply_1.safeReply)(interaction, '❌ Action inconnue.', 'status');
                    break;
            }
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - ${action} - Réussite en ${location}`, { source: 'status', includeStack: false });
        }
        catch (err) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, err, {
                source: 'status',
                userMessage: '❌ Erreur inattendue. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /status',
                includeStack: true
            });
            return;
        }
    }
};
exports.default = statusCommand;
