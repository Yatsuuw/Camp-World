"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fetchAniListMangas_1 = __importDefault(require("../../functions/Mangas/fetchAniListMangas"));
const fetchAniListAnimes_1 = __importDefault(require("../../functions/Animes/fetchAniListAnimes"));
const isServerInitialized_1 = require("../../functions/isServerInitialized");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
const log_1 = require("../../functions/logs/log");
const searchCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('search')
        .setDescription('Recherche un manga ou un animé (AniList + lien MAL si disponible).')
        .addStringOption((option) => option
        .setName('type')
        .setDescription('Objet de votre recherche')
        .addChoices({ name: 'Manga', value: 'manga' }, { name: 'Animé', value: 'anime' })
        .setRequired(true))
        .addStringOption((option) => option
        .setName('titre')
        .setDescription('Titre du manga ou animé à rechercher')
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        try {
            if (interaction.guild) {
                const ok = await (0, isServerInitialized_1.isServerInitialized)(interaction.guild.id);
                if (!ok) {
                    await (0, reply_1.safeReply)(interaction, "Ce serveur n'est pas initialisé. Contactez un administrateur.", 'search');
                    (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'search', includeStack: false });
                    return;
                }
            }
            const typeOpt = interaction.options.getString('type', true);
            const type = typeOpt;
            const query = (interaction.options.getString('titre', true) || '').trim();
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${query} - Réussite en serveur`, { source: 'search', includeStack: false });
            if (!query) {
                await (0, reply_1.safeReply)(interaction, 'Veuillez fournir un titre non vide.', 'search');
                return;
            }
            try {
                await interaction.deferReply();
            }
            catch (error) {
                await (0, handleErrorOptions_1.handleInteractionError)(interaction, error, {
                    source: 'search',
                    logMessage: 'Echec de deferReply.',
                    includeStack: true,
                });
                await (0, reply_1.safeReply)(interaction, '🔎 Recherche en cours…', 'search');
                return;
            }
            if (type === 'anime') {
                await (0, fetchAniListAnimes_1.default)(query, interaction);
            }
            else {
                await (0, fetchAniListMangas_1.default)(query, interaction);
            }
        }
        catch (err) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, err, {
                source: 'search',
                userMessage: '❌ Erreur: la recherche a échoué. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /search',
                includeStack: true
            });
            return;
        }
    }
};
exports.default = searchCommand;
