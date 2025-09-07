"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = formatError;
function formatError(error, includeStack = true) {
    if (!error)
        return 'Unknown error';
    const err = error;
    let formatted = `[${err?.name ?? 'Error'}] ${err?.message ?? String(error)}`;
    if (includeStack && err?.stack) {
        formatted += `\nStack:\n${err.stack}`;
    }
    return formatted;
}
