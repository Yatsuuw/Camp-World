"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const database_1 = require("../../utils/database/database");
const isServerInitialized_1 = require("../../functions/isServerInitialized");
const handleErrorOptions_1 = require("../../functions/logs/handleErrorOptions");
const reply_1 = require("../../functions/logs/reply");
const log_1 = require("../../functions/logs/log");
const MAL_BASE = normalizeBaseUrl(process.env.MAL_URL ?? '');
const AL_BASE = normalizeBaseUrl(process.env.AL_URL ?? '');
const MC_BASE = normalizeBaseUrl(process.env.MC_URL ?? '');
function normalizeBaseUrl(base) {
    return (base ?? '').trim().replace(/\/+$/, '');
}
function isValidUrl(url) {
    if (!url)
        return false;
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function buildProfileUrl(site, username) {
    const safeUser = encodeURIComponent(username);
    switch (site) {
        case 'mal':
            return `${MAL_BASE}/profile/${safeUser}`;
        case 'al':
            return `${AL_BASE}/user/${safeUser}`;
        case 'mangacollec':
            return `${MC_BASE}/user/${safeUser}/collection`;
    }
}
const profilCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('profil')
        .setDescription('Affiche ton profil MyAnimeList / AniList ou MangaCollec.')
        .addStringOption((option) => option
        .setName('type')
        .setDescription('Choississez entre MyAnimeList/AniList et MangaCollec.')
        .addChoices({ name: 'MyAnimeList', value: 'mal' }, { name: 'AniList', value: 'al' }, { name: 'MangaCollec', value: 'mangacollec' })
        .setRequired(true))
        .addUserOption((option) => option
        .setName('membre')
        .setDescription("Affiche le profil d'un autre membre.")
        .setRequired(false))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        try {
            if (interaction.guild) {
                const ok = await (0, isServerInitialized_1.isServerInitialized)(interaction.guild.id);
                if (!ok) {
                    await (0, reply_1.safeReply)(interaction, "Ce serveur n'est pas initialisé dans la base de données. Contactez un administrateur.", 'profil');
                    (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'profil', includeStack: false });
                    return;
                }
            }
            const type = interaction.options.getString('type', true);
            const target = interaction.options.getUser('membre', false);
            const user = target ?? interaction.user;
            const userId = user.id;
            (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${user}`, { source: 'profil', includeStack: false });
            const requesterTag = interaction.user.tag;
            const requesterIcon = interaction.user.displayAvatarURL();
            const userIcon = user.displayAvatarURL();
            if (type === 'mal') {
                let rows = [];
                try {
                    rows = await database_1.pool.query('SELECT mal_username FROM users WHERE user = ?', [userId]);
                }
                catch (dbErr) {
                    await (0, reply_1.safeReply)(interaction, 'Erreur MAL: lecture en base impossible. Réessayez plus tard.', 'profil');
                    return;
                }
                const username = rows[0]?.mal_username;
                if (!username) {
                    await (0, reply_1.safeReply)(interaction, target
                        ? `Ce membre n'a pas configuré son profil MyAnimeList.`
                        : `Vous n'avez pas configuré votre profil MyAnimeList. Utilisez /site_preference.`, 'profil');
                    return;
                }
                const profileUrl = buildProfileUrl('mal', username);
                const hasValidUrl = isValidUrl(profileUrl);
                const thumbnailPath = path_1.default.resolve('./src/assets/mal_logo.png');
                const embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `Profil MyAnimeList de ${user.username}`,
                    iconURL: userIcon || requesterIcon,
                    url: hasValidUrl ? profileUrl : undefined
                })
                    .setThumbnail('attachment://mal_logo.png')
                    .setColor('#2e51a2')
                    .setDescription(hasValidUrl
                    ? `[Accéder au profil complet sur MyAnimeList](${profileUrl})`
                    : `Lien de profil MyAnimeList indisponible.`)
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });
                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
                return;
            }
            else if (type === 'al') {
                let rows = [];
                try {
                    rows = await database_1.pool.query('SELECT al_username FROM users WHERE user = ?', [userId]);
                }
                catch {
                    await (0, reply_1.safeReply)(interaction, 'Erreur AniList: lecture en base impossible. Réessayez plus tard.', 'profil');
                    return;
                }
                const username = rows[0]?.al_username;
                if (!username) {
                    await (0, reply_1.safeReply)(interaction, target
                        ? `Ce membre n'a pas configuré son profil AniList.`
                        : `Vous n'avez pas configuré votre profil AniList. Utilisez /site_preference.`, 'profil');
                    return;
                }
                const profileUrl = buildProfileUrl('al', username);
                const hasValidUrl = isValidUrl(profileUrl);
                const urlForEmbed = hasValidUrl ? profileUrl : null;
                const thumbnailPath = path_1.default.resolve('./src/assets/al_logo.png');
                const embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `Profil AniList de ${user.username}`,
                    iconURL: userIcon || requesterIcon,
                    url: hasValidUrl ? profileUrl : undefined
                })
                    .setURL(urlForEmbed)
                    .setThumbnail('attachment://al_logo.png')
                    .setColor(0x00ccbc)
                    .setDescription(hasValidUrl
                    ? `[Accéder au profil complet sur AniList](${profileUrl})`
                    : `Lien de profil AniList indisponible.`)
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });
                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
                return;
            }
            else if (type === 'mangacollec') {
                let rows = [];
                try {
                    rows = await database_1.pool.query('SELECT mangacollec FROM users WHERE user = ?', [userId]);
                }
                catch {
                    await (0, reply_1.safeReply)(interaction, 'Erreur MangaCollec: lecture en base impossible. Réessayez plus tard.', 'profil');
                    return;
                }
                const username = rows[0]?.mangacollec;
                if (!username) {
                    await (0, reply_1.safeReply)(interaction, target
                        ? `Ce membre n'a pas configuré son identifiant MangaCollec.`
                        : `Vous n'avez pas configuré votre identifiant MangaCollec. Utilisez /site_preference.`, 'profil');
                    return;
                }
                const profileUrl = buildProfileUrl('mangacollec', username);
                const hasValidUrl = isValidUrl(profileUrl);
                const urlForEmbed = hasValidUrl ? profileUrl : null;
                const thumbnailPath = path_1.default.resolve('./src/assets/mangacollec_logo.png');
                const embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({
                    name: `Profil MangaCollec de ${user.username}`,
                    iconURL: userIcon || requesterIcon,
                    url: hasValidUrl ? profileUrl : undefined
                })
                    .setURL(urlForEmbed)
                    .setColor('#ed4245')
                    .setDescription(hasValidUrl
                    ? `[Accéder au profil complet sur MangaCollec](${profileUrl})`
                    : `Lien de profil MangaCollec indisponible.`)
                    .setThumbnail('attachment://mangacollec_logo.png')
                    .setTimestamp()
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });
                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
                return;
            }
            else {
                await (0, reply_1.safeReply)(interaction, 'Type de profil inconnu. Choisissez MyAnimeList, AniList ou MangaCollec.', 'profil');
            }
        }
        catch (err) {
            await (0, handleErrorOptions_1.handleInteractionError)(interaction, err, {
                source: 'profil',
                userMessage: "Une erreur imprévue est survenue. Réessayez plus tard.",
                logMessage: 'Erreur inattendue dans /profil',
                includeStack: true
            });
            return;
        }
    }
};
exports.default = profilCommand;
