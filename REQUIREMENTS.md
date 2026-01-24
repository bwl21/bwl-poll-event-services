# ChurchTools - Extension für eine Umfrage, wer für welchen Event welche Dienste übernehmen kann

## Überblick

Diese ChurchTools-Erweiterung ermöglicht es Benutzern, ihre Verfügbarkeit für Dienste in kommenden Events anzugeben. Die Erweiterung zeigt alle Events an, bei denen Dienste zu besetzen sind, die von den Gruppen des Benutzers besetzt werden können.

## Funktionen

### 1. Event-Übersicht
- **Zeitraum**: Standardmäßig werden Events für die nächsten 90 Tage angezeigt
- **Filterung**: Es werden nur Events angezeigt, die Dienste enthalten, welche von mindestens einer der Gruppen des Benutzers besetzt werden können
- **Darstellung**: Jedes Event wird mit folgenden Informationen angezeigt:
  - Event-Name
  - Datum (formatiert: Wochentag, Tag, Monat, Jahr)
  - Uhrzeit (formatiert: HH:MM Uhr)

### 2. Dienste-Abfrage
Für jeden Dienst in einem Event kann der Benutzer seine Verfügbarkeit angeben:

#### Antwortmöglichkeiten:
- **✓ Ja**: Der Benutzer kann den Dienst übernehmen
- **? Vielleicht**: Der Benutzer ist sich nicht sicher oder kann nur unter bestimmten Bedingungen
- **✗ Nein**: Der Benutzer kann den Dienst nicht übernehmen

#### Kommentarfeld:
- Jeder Dienst hat ein optionales Kommentarfeld
- Automatisches Speichern nach 1 Sekunde (Debounce)
- Rückmeldung bei erfolgreichem Speichern

### 3. Datenspeicherung
Alle Antworten werden im ChurchTools Key-Value-Store gespeichert:

#### Datenstruktur:
```typescript
{
    eventId: number,        // ID des Events
    serviceId: number,      // ID des Dienstes
    response: 'yes' | 'maybe' | 'no' | null,  // Antwort des Benutzers
    comment: string,        // Optionaler Kommentar
    timestamp: string       // Zeitstempel der letzten Änderung (ISO 8601)
}
```

#### Storage-Hierarchie:
- **Modul**: `bwl-poll-event-services`
- **Kategorie**: `poll-responses`
- **Werte**: Ein Wert pro Event-Dienst-Kombination

### 4. Benutzeroberfläche

#### Design-Prinzipien:
- Klare, übersichtliche Darstellung
- Responsive Design
- Farbcodierung für verschiedene Antworttypen:
  - Grün (✓ Ja): #4CAF50
  - Orange (? Vielleicht): #FF9800
  - Rot (✗ Nein): #f44336
- Visuelle Rückmeldung bei Interaktionen
- Hover-Effekte für bessere Benutzerführung

#### Statusmeldungen:
- "Gespeichert ✓" bei erfolgreichem Speichern
- "Kommentar gespeichert ✓" bei Kommentar-Updates
- "Fehler beim Speichern" bei Fehlern

### 5. Sicherheit
- XSS-Schutz durch HTML-Escaping aller Benutzereingaben
- Authentifizierung über ChurchTools-Login
- Berechtigungsprüfung basierend auf Gruppenzugehörigkeit

## Technische Implementierung

### Architektur
Die Anwendung ist in mehrere Module aufgeteilt:

1. **types.ts**: TypeScript-Typdefinitionen
2. **pollService.ts**: Business-Logik für Event-Abruf und Datenspeicherung
3. **ui.ts**: UI-Rendering und Benutzerinteraktionen
4. **main.ts**: Haupteinstiegspunkt der Anwendung

### API-Endpunkte
Die Erweiterung nutzt folgende ChurchTools-API-Endpunkte:

- `GET /events?from={date}&to={date}&include=eventServices` - Events mit Diensten abrufen
- `GET /whoami` - Aktuellen Benutzer abrufen
- `GET /persons/{personId}/groupmemberships` - Gruppenzugehörigkeiten abrufen
- `GET /events/masterdata` - Dienste und Dienst-Gruppen abrufen
- ChurchTools Key-Value-Store API für Datenpersistierung

### Abhängigkeiten
- `@churchtools/churchtools-client`: ^1.4.0 - ChurchTools API-Client
- `vite`: ^7.1.2 - Build-Tool
- `typescript`: ^5.9.2 - TypeScript-Compiler

## Installation und Verwendung

### Entwicklung
1. Repository klonen
2. `.env` Datei erstellen (siehe `.env-example`)
3. `npm install` ausführen
4. `npm run dev` für Development-Server starten

### Deployment
1. `npm run deploy` ausführen
2. Erstelltes Package aus `releases` Ordner in ChurchTools hochladen
3. Extension in ChurchTools aktivieren

## Konfiguration

### Environment-Variablen (.env)
```
VITE_KEY=bwl-poll-event-services
VITE_BASE_URL=https://ihre-instanz.church.tools
VITE_USERNAME=ihr-benutzername (nur für Entwicklung)
VITE_PASSWORD=ihr-passwort (nur für Entwicklung)
```

## Berechtigungen
Benutzer können nur Events und Dienste sehen, für die sie aufgrund ihrer Gruppenzugehörigkeit berechtigt sind.

## Zukünftige Erweiterungen (Optional)
- Export-Funktion für Umfrageergebnisse
- Admin-Ansicht zur Auswertung aller Antworten
- Email-Benachrichtigungen bei neuen Events
- Filtermöglichkeiten (z.B. nur Events einer bestimmten Gruppe)
- Anpassbarer Zeitraum statt festem 90-Tage-Fenster
