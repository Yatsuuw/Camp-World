import { SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction } from 'discord.js';
import sitePreferenceCommand from "./sitePreference";
import profilCommand from "./profil";
import profilMangaCollecCommand from "./profilMangaCollec";
import helpCommand from './help';
import statusCommand from './status';
import searchCommand from "./search";
import configProfilCommand from "./configProfil";
import serverCommand from "./server";
import {ClientWithCommands} from "../types/ClientWithCommands";

const commands: { data: SlashCommandOptionsOnlyBuilder; execute(interaction: ChatInputCommandInteraction, Client: ClientWithCommands): Promise<void> }[] = [
    serverCommand,
    sitePreferenceCommand,
    configProfilCommand,
    profilCommand,
    profilMangaCollecCommand,
    searchCommand,
    helpCommand,
    statusCommand,
];

export default commands;