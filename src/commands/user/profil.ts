import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandUserOption,
    SlashCommandStringOption,
    User,
    EmbedBuilder
} from 'discord.js';
import path from 'path';
import { pool } from '../../utils/database/database';
import { isServerInitialized } from '../../functions/isServerInitialized';
import { handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";
import { log } from "../../functions/logs/log";

type RowMal = { mal_username: string };
type RowAl = { al_username: string };
type RowMC = { mangacollec: string };

const MAL_BASE: string = normalizeBaseUrl(process.env.MAL_URL ?? '');
const AL_BASE: string = normalizeBaseUrl(process.env.AL_URL ?? '');
const MC_BASE: string = normalizeBaseUrl(process.env.MC_URL ?? '');

function normalizeBaseUrl(base: string): string {
    return (base ?? '').trim().replace(/\/+$/, '');
}

function isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function buildProfileUrl(site: 'mal' | 'al' | 'mangacollec', username: string): string {
    const safeUser: string = encodeURIComponent(username);
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
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Affiche ton profil MyAnimeList, AniList ou MangaCollec.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('type')
                .setDescription('Choississez entre MyAnimeList, AniList et MangaCollec.')
                .addChoices(
                    { name: 'MyAnimeList', value: 'mal' },
                    { name: 'AniList', value: 'al' },
                    { name: 'MangaCollec', value: 'mangacollec' }
                )
                .setRequired(true)
        )
        .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption =>
            option
                .setName('membre')
                .setDescription("Affiche le profil d'un autre membre.")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            if (interaction.guild) {
                const ok: boolean = await isServerInitialized(interaction.guild.id);
                if (!ok) {
                    await safeReply(
                        interaction,
                        "Ce serveur n'est pas initialisé dans la base de données. Contactez un administrateur.",
                        'profil'
                    );
                    log('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'profil', includeStack: false });
                    return;
                }
            }

            const type: string = interaction.options.getString('type', true);
            const target: User | null = interaction.options.getUser('membre', false);
            const user: User = target ?? interaction.user;
            const userId: string = user.id;
            const location: string = interaction.guild ? 'serveur' : 'messages privés'

            const requesterTag: string = interaction.user.tag;
            const requesterIcon: string = interaction.user.displayAvatarURL();
            const userIcon: string = user.displayAvatarURL();

            if (type === 'mal') {
                let rows: RowMal[] = [];
                try {
                    rows = await pool.query<RowMal[]>('SELECT mal_username FROM users WHERE user = ?', [userId]);
                } catch (dbErr) {
                    await safeReply(
                        interaction,
                        'Erreur MAL: lecture en base impossible. Réessayez plus tard.',
                        'profil'
                    );
                    return;
                }

                const username: string | undefined = rows[0]?.mal_username;
                if (!username) {
                    await safeReply(
                        interaction,
                        target
                            ? `Ce membre n'a pas configuré son profil MyAnimeList.`
                            : `Vous n'avez pas configuré votre profil MyAnimeList. Utilisez /site_preference.`,
                        'profil'
                    );
                    return;
                }

                const profileUrl: string = buildProfileUrl('mal', username);
                const hasValidUrl: boolean = isValidUrl(profileUrl);

                const thumbnailPath: string = path.resolve('./dist/assets/mal_logo.png');
                const embed: EmbedBuilder = new EmbedBuilder()
                    .setAuthor({
                        name: `Profil MyAnimeList de ${user.username}`,
                        iconURL: userIcon || requesterIcon,
                        url: hasValidUrl ? profileUrl : undefined
                    })
                    .setThumbnail('attachment://mal_logo.png')
                    .setColor('#2e51a2')
                    .setDescription(
                        hasValidUrl
                            ? `[Accéder au profil complet sur MyAnimeList](${profileUrl})`
                            : `Lien de profil MyAnimeList indisponible.`
                    )
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });

                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
            } else if (type === 'al') {
                let rows: RowAl[] = [];
                try {
                    rows = await pool.query<RowAl[]>('SELECT al_username FROM users WHERE user = ?', [userId]);
                } catch {
                    await safeReply(
                        interaction,
                        'Erreur AniList: lecture en base impossible. Réessayez plus tard.',
                        'profil'
                    );
                    return;
                }

                const username: string | undefined = rows[0]?.al_username;
                if (!username) {
                    await safeReply(
                        interaction,
                        target
                            ? `Ce membre n'a pas configuré son profil AniList.`
                            : `Vous n'avez pas configuré votre profil AniList. Utilisez /site_preference.`,
                        'profil'
                    );
                    return;
                }

                const profileUrl: string = buildProfileUrl('al', username);
                const hasValidUrl: boolean = isValidUrl(profileUrl);
                const urlForEmbed: string | null = hasValidUrl ? profileUrl : null;

                const thumbnailPath: string = path.resolve('./dist/assets/al_logo.png');
                const embed: EmbedBuilder = new EmbedBuilder()
                    .setAuthor({
                        name: `Profil AniList de ${user.username}`,
                        iconURL: userIcon || requesterIcon,
                        url: hasValidUrl ? profileUrl : undefined
                    })
                    .setURL(urlForEmbed)
                    .setThumbnail('attachment://al_logo.png')
                    .setColor(0x00ccbc)
                    .setDescription(
                        hasValidUrl
                            ? `[Accéder au profil complet sur AniList](${profileUrl})`
                            : `Lien de profil AniList indisponible.`
                    )
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });

                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
            } else if (type === 'mangacollec') {
                let rows: RowMC[] = [];
                try {
                    rows = await pool.query<RowMC[]>('SELECT mangacollec FROM users WHERE user = ?', [userId]);
                } catch {
                    await safeReply(
                        interaction,
                        'Erreur MangaCollec: lecture en base impossible. Réessayez plus tard.',
                        'profil'
                    );
                    return;
                }

                const username: string | undefined = rows[0]?.mangacollec;
                if (!username) {
                    await safeReply(
                        interaction,
                        target
                            ? `Ce membre n'a pas configuré son identifiant MangaCollec.`
                            : `Vous n'avez pas configuré votre identifiant MangaCollec. Utilisez /site_preference.`,
                        'profil'
                    );
                    return;
                }

                const profileUrl: string = buildProfileUrl('mangacollec', username);
                const hasValidUrl: boolean = isValidUrl(profileUrl);
                const urlForEmbed: string | null = hasValidUrl ? profileUrl : null;

                const thumbnailPath: string = path.resolve('./dist/assets/mangacollec_logo.png');
                const embed: EmbedBuilder = new EmbedBuilder()
                    .setAuthor({
                        name: `Profil MangaCollec de ${user.username}`,
                        iconURL: userIcon || requesterIcon,
                        url: hasValidUrl ? profileUrl : undefined
                    })
                    .setURL(urlForEmbed)
                    .setColor('#ed4245')
                    .setDescription(
                        hasValidUrl
                            ? `[Accéder au profil complet sur MangaCollec](${profileUrl})`
                            : `Lien de profil MangaCollec indisponible.`
                    )
                    .setThumbnail('attachment://mangacollec_logo.png')
                    .setTimestamp()
                    .setFooter({ text: `Demandé par ${requesterTag}`, iconURL: requesterIcon });

                await interaction.reply({ embeds: [embed], files: [thumbnailPath] });
            } else {
                await safeReply(
                    interaction,
                    'Type de profil inconnu. Choisissez MyAnimeList, AniList ou MangaCollec.',
                    'profil'
                );
                return;
            }

            log('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${user} - Réussite en ${location}`, { source: 'profil', includeStack: false });
            return;
        } catch (err: unknown) {
            await handleInteractionError(interaction, err, {
                source: 'profil',
                userMessage: "Une erreur imprévue est survenue. Réessayez plus tard.",
                logMessage: 'Erreur inattendue dans /profil',
                includeStack: true
            });
            return;
        }
    }
};

export default profilCommand;