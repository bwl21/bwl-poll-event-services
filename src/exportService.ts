/**
 * Excel export functionality for poll responses
 */
import * as XLSX from 'xlsx';
import type { EventWithServices, ServicePollEntry } from './types';
import { prepareResponseRows, formatResponse, formatTimestamp } from './pollService';

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

export function exportToExcel(
    events: EventWithServices[],
    responses: ServicePollEntry[]
): void {
    // Use shared data preparation logic
    const preparedRows = prepareResponseRows(events, responses, true); // includeEmpty = true for Excel

    // Convert to Excel format
    const rows: ExportRow[] = preparedRows.map(row => ({
        'Event': row.eventName,
        'Wochentag': row.weekday,
        'Datum': row.date,
        'Uhrzeit': row.time,
        'Dienst': row.serviceName,
        'Besetzung': row.assignment,
        'Benutzer': row.userName,
        'Antwort': formatResponse(row.response),
        'Kommentar': row.comment,
        'Zeitstempel': row.timestamp ? formatTimestamp(row.timestamp) : '',
    }));

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
