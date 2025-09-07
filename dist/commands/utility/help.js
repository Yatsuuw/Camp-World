"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const log_1 = require("../../functions/logs/log");
const helpCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche les commandes disponibles de Camp\'World.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        (0, log_1.log)('info', `${interaction.user.globalName} (${interaction.user.id}) - Réussite`, { source: 'help', includeStack: false });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Aide')
            .setThumbnail(interaction.client.user.displayAvatarURL() || null)
            .setDescription('Manuel d\'utilisation de Camp\'World.')
            .setColor('Green')
            .addFields([
            { name: '/server <Intialiser | Supprimer>', value: 'Modifiez le statut de votre serveur dans la base de données.' },
            { name: '/config_profil <MyAnimeList | Anilist | MangaCollec> <nom>', value: 'Configurez le __nom__ de votre profil MyAnimeList, Anilist ainsi que le __nom__ de votre profil MangaCollec dans le robot. Vous ne pouvez pas cumuler un nom pour MyAnimeList et pour AniList à la fois, soit l\'un ou soit l\'autre.' },
            { name: '/profil <type> [membre]', value: 'Affichez votre profil, ou celui d\'un autre utilisateur, MyAnimeList, AniList ou MangaCollec.' },
            { name: '/search <Animé | Manga> <Nom> [Site]', value: 'Recherchez un manga ou un animé depuis le site de votre choix, ou depuis le site que vous avez défini par défaut dans le `/site_preference`.' },
            { name: '/status <Redémarrer | Déployer les commandes dans l\'API>', value: '__Commande uniquement disponible pour la propriétaire du robot :__\nRedémarrez le robot ou déployez ses commandes dans l\'API de Discord.' },
            { name: '/help', value: `Menu d'assistance pour l'utilisation du robot.` },
            { name: 'Légende', value: '<> → Information obligatoire à saisir.\n[] → Information optionnelle à saisir.' }
        ])
            .setTimestamp()
            .setFooter({
            text: `Demandé par ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL() || undefined,
        });
        await interaction.reply({
            embeds: [embed],
        });
    }
};
exports.default = helpCommand;
