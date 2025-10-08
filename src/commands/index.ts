import { Command } from "../types/ClientWithCommands";
import profilCommand from "./user/profil";
import helpCommand from './utility/help';
import statusCommand from './admin/status';
import searchCommand from "./user/search";
import configCommand from "./user/config";
import serverCommand from "./admin/server";

const commands: Command[] = [
    serverCommand,
    statusCommand,

    configCommand,
    profilCommand,
    searchCommand,

    helpCommand,
];

export default commands;