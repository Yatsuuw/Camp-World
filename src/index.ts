import {
    Client,
    GatewayIntentBits,
    Collection,
    Interaction,
    ActivityType,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { ClientWithCommands } from './types/ClientWithCommands';
import interactionCreate from './events/interactionCreate';
import commands from './commands';

dotenv.config();
const DISCORD_TOKEN: string = process.env.DISCORD_TOKEN!;

export const client = new Client({
    intents: [GatewayIntentBits.Guilds],
}) as ClientWithCommands;

client.commands = new Collection();

for (const command of commands) {
    if (!command || !command.data || typeof command.data.name !== 'string') {
        console.warn('❌ Commande invalide ignorée : ', command);
        continue;
    }

    client.commands.set(command.data.name, command);
}

client.on(interactionCreate.name, async (interaction: Interaction): Promise<void> => {
    await interactionCreate.execute(interaction, client);
});

client.once('ready', (): void => {
    if (!client.user) {
        console.error('❌ Le client n\'a pas de user après le ready event.');
        return;
    }

    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

    client.user.setPresence({
        activities: [{
            name: 'Laid Back Camp saison 3',
            type: ActivityType.Watching,
        }],
        status: 'online',
    });
});

client.login(DISCORD_TOKEN);
