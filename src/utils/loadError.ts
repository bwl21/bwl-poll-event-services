export function getLoadErrorMessage(error: unknown): string {
    const details = error !== null && typeof error === 'object'
        ? error as { code?: string; name?: string }
        : undefined;
    if (
        details?.code === 'ERR_CANCELED' ||
        details?.code === 'ECONNABORTED' ||
        details?.code === 'ETIMEDOUT' ||
        details?.name === 'AbortError' ||
        details?.name === 'TimeoutError' ||
        details?.name === 'CanceledError'
    ) {
        return 'Das Laden der Dienste wurde abgebrochen oder hat zu lange gedauert. Bitte verkürzen Sie den Zeitraum (z. B. auf 30 Tage) und versuchen Sie es erneut.';
    }
    return 'Die Dienste konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
}
