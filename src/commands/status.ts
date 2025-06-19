import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    SlashCommandStringOption,
    ChatInputCommandInteraction } from 'discord.js';
import { exec, ExecException } from 'child_process';
import {isServerInitialized} from "../functions/isServerInitialized";

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
                    { name: 'Déployer les commandes dans l\'API', value: 'deploy'}
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.guild) {
            if (!(await isServerInitialized(interaction.guild.id))) {
                await interaction.reply({
                    content: 'Le serveur n\'est pas initialisé dans la base de données. Veuillez contacter un administrateur.',
                    flags: 64,
                });
                return;
            }
        }

        if (interaction.user.id !== process.env.OWNER_ID) {
            await interaction.reply({
                content: `Seule la propriétaire du robot a la permission d'exécuter cette commande.`,
                flags: 64
            });
            return;
        }

        const action: string = interaction.options.getString('action', true);

        await interaction.deferReply({ flags: 64 });

        switch (action) {
            case 'restart':
                await interaction.editReply('🔄 Redémarrage en cours...');
                console.log('Redémarrage demandé par', interaction.user.tag);
                setTimeout((): never => process.exit(0), 1000);
                break;
            case 'deploy':
                try {

                    exec('npx ts-node src/deploy-commands.ts', (error: ExecException | null, stdout: string, stderr: string): void => {
                        if (error) {
                            console.error(`Erreur de déploiement : ${error.message}`);
                            interaction.editReply({ content: `❌ Erreur : ${error.message}`});
                            return;
                        }
                        if (stderr) {
                            console.error(`stderr : ${stderr}`);
                        }
                        console.log(`stdout : ${stdout}`);
                        interaction.editReply({ content: `✅ Déploiement terminé.\n\`\`\`\n${stdout}\n\`\`\``
                    });
                    });
                } catch (err: any) {
                    console.error('Erreur dans le bloc deploy :', err);
                    await interaction.editReply('❌ Une erreur inconnue est survenue.');
                }
                break;
            default:
                await interaction.editReply('❌ Action inconnue.');
                break;
        }

    }

};

export default statusCommand;