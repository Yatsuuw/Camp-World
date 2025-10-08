import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandStringOption,
    PermissionFlagsBits
} from 'discord.js';
import { pool } from '../../utils/database/database';
import { isServerInitialized } from '../../functions/isServerInitialized';
import { handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";
import { log } from "../../functions/logs/log";

type ProfileType = 'mal' | 'al' | 'mangacollec';
type ColName = 'mal_username' | 'al_username' | 'mangacollec';

interface UpsertParams {
    userId: string;
    column: ColName;
    value: string;
}

function toColumn(type: ProfileType): ColName {
    switch (type) {
        case 'mal':
            return 'mal_username';
        case 'al':
            return 'al_username';
        case 'mangacollec':
            return 'mangacollec';
    }
}

function toWebsiteLabel(type: ProfileType): string {
    switch (type) {
        case 'mal':
            return 'MyAnimeList';
        case 'al':
            return 'AniList';
        case 'mangacollec':
            return 'MangaCollec';
    }
}

function sanitizeInput(input: string): string {
    const val: string = (input ?? '').trim();
    return val.slice(0, 64);
}

async function upsertUserField(params: UpsertParams): Promise<void> {
    const { userId, column, value } = params;
    const safeColumn: ColName = column;

    const sql: string = `
        INSERT INTO users (\`user\`, \`${safeColumn}\`)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE \`${safeColumn}\` = VALUES(\`${safeColumn}\`)
    `;
    await pool.query(sql, [userId, value]);
}

const configCommand = {
    data: new SlashCommandBuilder()
        .setName('config_profil')
        .setDescription('Configurez votre profil MyAnimeList, AniList ou votre identifiant MangaCollec.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('type')
                .setDescription('Choisissez la plateforme à configurer.')
                .addChoices(
                    { name: 'MyAnimeList', value: 'mal' },
                    { name: 'AniList', value: 'al' },
                    { name: 'MangaCollec', value: 'mangacollec' }
                )
                .setRequired(true)
        )
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('nom')
                .setDescription('Votre identifiant / nom de profil sur la plateforme choisie.')
                .setRequired(true)
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
                        'config'
                    );
                    log('info', `${interaction.user.globalName} (${interaction.user.id}) - Échec serveur non initialisé`, { source: 'config_profil', includeStack: false })
                    return;
                }
            }

            const userId: string = interaction.user.id;
            const typeOpt: string = interaction.options.getString('type', true);
            const type: ProfileType = (typeOpt as ProfileType);
            const rawName: string = interaction.options.getString('nom', true);
            const username: string = sanitizeInput(rawName);
            const location: string = interaction.guild ? 'serveur' : 'messages privés'

            if (!username) {
                await safeReply(
                    interaction,
                    "Nom invalide: veuillez fournir un identifiant non vide.",
                    'config'
                );
                return;
            }

            try {
                const column: ColName = toColumn(type);
                await upsertUserField({ userId, column, value: username });
            } catch (dbErr: unknown) {
                await handleInteractionError(interaction, dbErr, {
                    source: 'config',
                    userMessage: "Erreur base de données: impossible d'enregistrer votre configuration pour le moment.",
                    logMessage: `Erreur DB lors de l'upsert du profil (user=${userId})`,
                    includeStack: true
                });
                return;
            }

            const website: string = toWebsiteLabel(type);
            await safeReply(
                interaction,
                `Votre configuration ${website} a été mise à jour.`,
                'config'
            );

            log('info', `${interaction.user.globalName} (${interaction.user.id}) - ${type} - ${username} - Réussite en ${location}`, { source: 'config_profil', includeStack: false });
        } catch (err: unknown) {
            await handleInteractionError(interaction, err, {
                source: 'config',
                userMessage: "Une erreur imprévue est survenue. Réessayez plus tard.",
                logMessage: 'Erreur inattendue dans config_profil',
                includeStack: true
            });
            return;
        }
    }
};

export default configCommand;