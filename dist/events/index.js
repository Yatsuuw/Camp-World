"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
const clientReady_1 = require("./client/clientReady");
const interactionCreate_1 = require("./commands/interactionCreate");
exports.events = [
    clientReady_1.readyEvent,
    interactionCreate_1.interactionCreate,
];
