import { ClientWithCommands } from "../types/ClientWithCommands";
import { Interaction } from "discord.js";
import { readyEvent } from './client/clientReady';
import { interactionCreate } from './commands/interactionCreate';

export const events: ({
    name: string
    once: boolean
    execute(client: ClientWithCommands): Promise<void>
} | {
    name: string
    once: boolean
    execute(interaction: Interaction, client: ClientWithCommands): Promise<void>
})[] = [
    readyEvent,
    interactionCreate,
]
