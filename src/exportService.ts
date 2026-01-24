/**
 * Excel export functionality for poll responses
 */
import * as XLSX from 'xlsx';
import type { EventWithServices, ServicePollEntry } from './types';

interface ExportRow {
    'Event': string;
    'Datum': string;
    'Dienst': string;
    'Benutzer': string;
    'Antwort': string;
    'Kommentar': string;
    'Zeitstempel': string;
}

function formatResponse(response: string | null): string {
    switch (response) {
        case 'yes':
            return 'Ja';
        case 'maybe':
            return 'Vielleicht';
        case 'no':
            return 'Nein';
        default:
            return '-';
    }
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE');
}

export function exportToExcel(
    events: EventWithServices[],
    responses: ServicePollEntry[]
): void {
    const rows: ExportRow[] = [];

    // Create a map for quick lookup
    const responseMap = new Map<string, ServicePollEntry[]>();
    for (const response of responses) {
        const key = `${response.eventId}-${response.serviceId}`;
        if (!responseMap.has(key)) {
            responseMap.set(key, []);
        }
        responseMap.get(key)!.push(response);
    }

    // Build export rows
    for (const event of events) {
        for (const service of event.services) {
            const serviceResponses = responseMap.get(`${event.id}-${service.id}`) || [];

            if (serviceResponses.length === 0) {
                // Add row even if no responses
                rows.push({
                    'Event': event.name,
                    'Datum': formatDate(event.startDate),
                    'Dienst': service.name,
                    'Benutzer': '-',
                    'Antwort': '-',
                    'Kommentar': '',
                    'Zeitstempel': '',
                });
            } else {
                for (const response of serviceResponses) {
                    rows.push({
                        'Event': event.name,
                        'Datum': formatDate(event.startDate),
                        'Dienst': service.name,
                        'Benutzer': response.userName || `User ${response.userId}`,
                        'Antwort': formatResponse(response.response),
                        'Kommentar': response.comment || '',
                        'Zeitstempel': formatTimestamp(response.timestamp),
                    });
                }
            }
        }
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Umfrage-Antworten');

    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Event
        { wch: 20 }, // Datum
        { wch: 20 }, // Dienst
        { wch: 20 }, // Benutzer
        { wch: 12 }, // Antwort
        { wch: 30 }, // Kommentar
        { wch: 20 }, // Zeitstempel
    ];

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `dienste-umfrage-${today}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
}
