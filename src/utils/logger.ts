const DEBUG = new URLSearchParams(window.location.search).has('debug');

export function createLogger(prefix: string) {
    return (...args: unknown[]) => {
        if (DEBUG) {
            console.log(`[${prefix}]`, ...args);
        }
    };
}
