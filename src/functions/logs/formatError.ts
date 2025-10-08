export function formatError(error: unknown, includeStack: boolean = true): string {
    if (!error) return 'Unknown error';
    const err = error as { name?: string; message?: string; stack?: string };
    let formatted: string = `[${err?.name ?? 'Error'}] ${err?.message ?? String(error)}`;
    if (includeStack && err?.stack) {
        formatted += `\nStack:\n${err.stack}`;
    }
    return formatted;
}
