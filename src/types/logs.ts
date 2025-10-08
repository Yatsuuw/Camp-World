export type Logs = 'info' | 'warn' | 'error' | 'debug';

export interface LogOptions {
    source?: string;
    includeStack?: boolean
}
