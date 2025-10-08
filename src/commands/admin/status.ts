import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandStringOption,
    ChatInputCommandInteraction,
} from 'discord.js';
import { exec, ExecException } from 'child_process';
import { isServerInitialized } from "../../functions/isServerInitialized";
import { ClientWithCommands } from "../../types/ClientWithCommands";
import { handleInteractionError } from "../../functions/logs/handleErrorOptions";
import { safeReply } from "../../functions/logs/reply";
import { testDatabaseConnection } from "../../utils/database/database";
import { log } from "../../functions/logs/log";

const statusCommand = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Affiche et modifie le statut du robot.')
        .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption =>
            option
                .setName('action')
                .setDescription('Effectue une action directe sur le robot.')
                .addChoices(
                    { name: 'Redémarrer', value: 'restart' },
                    { name: 'Test de connexion à la base de données', value: 'dbTest' },
                    { name: 'Déployer les commandes dans l\'API', value: 'deploy' }
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction, client: ClientWithCommands): Promise<void> {
        try {
            if (interaction.guild) {
                const initialized: boolean = await isServerInitialized(interaction.guild.id);
                if (!initialized) {
                    await safeReply(
                        interaction,
                        "Le serveur n'est pas initialisé dans la base de données. Veuillez contacter un administrateur.",
                        'status'
                    );
                    log('error', `${interaction.user.globalName} (${interaction.user.id}) - Échec hors serveur`, { source: 'status', includeStack: false })
                    return;
                }
            }

            const action: string = interaction.options.getString('action', true);
            const location: string = interaction.guild ? 'serveur' : 'messages privés'
            await interaction.deferReply({ flags: 64 });

            if (interaction.user.id !== process.env.OWNER_ID) {
                await safeReply(
                    interaction,
                    "Seule la propriétaire du robot a la permission d'exécuter cette commande.",
                    'status'
                );
                return;
            }

            switch (action) {
                case 'restart': {
                    await interaction.editReply(
                        `🔄✅ Redémarrage terminé.\n→ Nombre de serveurs : ${client.guilds.cache.size}`
                    );
                    log('error', `Redémarrage demandé par ${interaction.user.tag}`, { source: 'status', includeStack: true });
                    setTimeout((): never => process.exit(0), 1000);
                    break;
                }

                case 'dbTest': {
                    const dbOk: boolean = await testDatabaseConnection();

                    if (!dbOk) {
                        await interaction.editReply({
                            content: '❌ Le test de connexion à la base de données a échoué.'
                        })
                    } else {
                        await interaction.editReply({
                            content: '✅ Le test de connexion à la base de données a réussi.'
                        })
                    }

                    break;
                }

                case 'deploy': {
                    exec(
                        'node dist/deploy-commands.js',
                        async (error: ExecException | null, stdout: string, stderr: string): Promise<void> => {
                            if (error) {
                                await handleInteractionError(interaction, error, {
                                    source: 'status',
                                    userMessage: `❌ Erreur de déploiement : ${error.message}`,
                                    logMessage: 'Erreur lors du déploiement des commandes',
                                    includeStack: true
                                });
                                return;
                            }
                            if (stderr) {
                                log('error', `[deploy:stderr] ${stderr}`, { source: 'status', includeStack: true });
                            }
                            log('info', `[deploy:stdout] ${stdout}`, { source: 'status', includeStack: true });
                            try {
                                await interaction.editReply({
                                    content: `✅ Déploiement terminé.\n\`\`\`\n${stdout}\n\`\`\``
                                });
                            } catch (notifyErr: unknown) {
                                await handleInteractionError(interaction, notifyErr, {
                                    source: 'status',
                                    userMessage: '❌ Impossible d\'envoyer le résultat du déploiement.',
                                    logMessage: 'Echec interaction.editReply après déploiement',
                                    includeStack: true
                                });
                                return;
                            }
                        }
                    );
                    break;
                }

                default:
                    await safeReply(interaction, '❌ Action inconnue.', 'status');
                    break;
            }

            log('info', `${interaction.user.globalName} (${interaction.user.id}) - ${action} - Réussite en ${location}`, { source: 'status', includeStack: false });
        } catch (err: unknown) {
            await handleInteractionError(interaction, err, {
                source: 'status',
                userMessage: '❌ Erreur inattendue. Réessayez plus tard.',
                logMessage: 'Erreur inattendue dans /status',
                includeStack: true
            });
            return;
        }
    }
};

export default statusCommand;
