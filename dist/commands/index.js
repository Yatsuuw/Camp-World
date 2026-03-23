"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const profil_1 = __importDefault(require("./user/profil"));
const help_1 = __importDefault(require("./utility/help"));
const status_1 = __importDefault(require("./admin/status"));
const search_1 = __importDefault(require("./user/search"));
const config_1 = __importDefault(require("./user/config"));
const server_1 = __importDefault(require("./admin/server"));
const commands = [
    server_1.default,
    status_1.default,
    config_1.default,
    profil_1.default,
    search_1.default,
    help_1.default,
];
exports.default = commands;
