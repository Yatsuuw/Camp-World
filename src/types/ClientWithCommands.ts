import {
    ChatInputCommandInteraction,
    Client,
    Collection
} from 'discord.js';

export interface Command {
    data: {
        name: string;
        toJSON(): any;
    };
    execute(
        interaction: ChatInputCommandInteraction,
        client: ClientWithCommands
    ): Promise<void>;
}

export interface ClientWithCommands extends Client {
    commands: Collection<string, Command>;
}