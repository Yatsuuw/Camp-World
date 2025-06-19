import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} from 'discord.js';

const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche les commandes disponibles de Camp\'World.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle('Aide')
            .setThumbnail(interaction.client.user.displayAvatarURL() || null)
            .setDescription('Manuel d\'utilisation de Camp\'World.')
            .setColor('Green')
            .addFields([
                { name: '/server <Intialiser | Supprimer>', value: 'Modifiez le statut de votre serveur dans la base de données.' },
                { name: '/site_preference', value: 'Renseignez votre site préféré entre MyAnimeList et AniList pour votre profil et vos recherches d\'animés et de mangas.' },
                { name: '/config_profile <MyAnimeList/Anilist | MangaCollec> <nom>', value: 'Configurez le __nom__ de votre profil MyAnimeList/Anilist ainsi que le __nom__ de votre profil MangaCollec dans le robot.' },
                { name: '/profil [membre]', value: 'Affichez votre profil, ou celui d\'un autre utilisateur, MyAnimeList ou AniList selon la préférence du profil renseignée.' },
                { name: '/profil_mangacollec [membre]', value: 'Affichez votre collection MangaCollec ou celle d\'un autre membre.' },
                { name: '/search <Animé | Manga> <Nom> [Site]', value: 'Recherchez un manga ou un animé depuis le site de votre choix, ou depuis le site que vous avez défini par défaut dans le `/site_preference`.' },
                { name: '/status <Redémarrer | Déployer les commandes dans l\'API>', value: '__Commande uniquement disponible pour la propriétaire du robot :__\nRedémarrez le robot ou déployez ses commandes dans l\'API de Discord.' },
                { name: 'Légende', value: '<> → Information obligatoire à saisir.\n[] → Information non obligatoire à saisir.' }
            ])
            .setTimestamp()
            .setFooter({
                text: `Demandé par ${interaction.user.username}`,
                iconURL: interaction.user.avatarURL() || undefined
            });

        await interaction.reply({
            embeds: [embed],
        });
    }
}

export default helpCommand;