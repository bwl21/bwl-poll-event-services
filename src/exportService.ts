/**
 * Excel export functionality for poll responses
 */
import * as XLSX from 'xlsx';
import type { EventWithServices, ServicePollEntry } from './types';

interface ExportRow {
    'Event': string;
    'Wochentag': string;
    'Datum': string;
    'Uhrzeit': string;
    'Dienst': string;
    'Besetzung': string;
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

function formatWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
    });
}

function formatDateOnly(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('de-DE', {
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
            
            // Format assignment info
            let assignmentText = '';
            if ((service as any).assignments && (service as any).assignments.length > 0) {
                const assignment = (service as any).assignments[0];
                assignmentText = assignment.isConfirmed ? assignment.personName : `${assignment.personName} (angefordert)`;
            }

            if (serviceResponses.length === 0) {
                // Add row even if no responses
                rows.push({
                    'Event': event.name,
                    'Wochentag': formatWeekday(event.startDate),
                    'Datum': formatDateOnly(event.startDate),
                    'Uhrzeit': formatTime(event.startDate),
                    'Dienst': service.name,
                    'Besetzung': assignmentText,
                    'Benutzer': '-',
                    'Antwort': '-',
                    'Kommentar': '',
                    'Zeitstempel': '',
                });
            } else {
                for (const response of serviceResponses) {
                    rows.push({
                        'Event': event.name,
                        'Wochentag': formatWeekday(event.startDate),
                        'Datum': formatDateOnly(event.startDate),
                        'Uhrzeit': formatTime(event.startDate),
                        'Dienst': service.name,
                        'Besetzung': assignmentText,
                        'Benutzer': response.userName || `User ${response.userId}`,
                        'Antwort': formatResponse(response.response),
                        'Kommentar': response.comment || '',
                        'Zeitstempel': formatTimestamp(response.timestamp),
                    });
                }
            }
        }
    }

    // Create workbook and worksheet with column order
    const columnOrder = ['Event', 'Wochentag', 'Datum', 'Uhrzeit', 'Dienst', 'Besetzung', 'Benutzer', 'Antwort', 'Kommentar', 'Zeitstempel'];
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: columnOrder });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Umfrage-Antworten');

    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Event
        { wch: 12 }, // Wochentag
        { wch: 12 }, // Datum
        { wch: 10 }, // Uhrzeit
        { wch: 20 }, // Dienst
        { wch: 25 }, // Besetzung
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
