# ChurchTools - Extension für eine Umfrage, wer für welchen Event welche Dienste übernehmen kann

## Überblick

Diese ChurchTools-Erweiterung ermöglicht es Benutzern, ihre Verfügbarkeit für Dienste in kommenden Events anzugeben. Die Erweiterung zeigt alle Events an, bei denen Dienste zu besetzen sind, die von den Gruppen des Benutzers besetzt werden können.

### Status
- ✅ **Core-Funktionalität**: Implementiert und getestet
- ✅ **Event-Abruf und Filterung**: Funktional
- ✅ **Umfrage-Interface**: UI fertig (Mobile & Desktop)
- ✅ **Datenspeicherung**: Im Key-Value-Store funktional
- ✅ **Admin-Panel**: Mit Response-Management und Service-Config
- ✅ **Excel-Export**: Implementiert mit xlsx
- ✅ **E2E-Tests**: Playwright-Tests vorhanden
- 🔄 **Weitere Optimierungen**: Laufend

### Projekt-Info
- **Repository**: github.com/bwl21/bwl-poll-event-services
- **Version**: 0.3.2
- **Sprache**: TypeScript + Vue 3
- **Build-Tool**: Vite 7.3.1

## Funktionen

### 1. Event-Übersicht
- **Zeitraum**: Konfigurierbarer Zeitraum mit Startdatum und Anzahl Tage
  - Standard: Heute + 90 Tage
  - Im UI einstellbar über Datepicker (Startdatum) und Eingabefeld (Anzahl Tage)
  - Per URL-Parameter überschreibbar:
    - `?start=2025-02-01` - Startdatum (ISO-Format YYYY-MM-DD)
    - `?days=30` - Anzahl Tage
    - Beispiel: `?start=2025-03-01&days=60`
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
- finales Speichern beim klick auf einen der drei Buttons

### 3. Datenspeicherung
Alle Antworten werden im ChurchTools Key-Value-Store gespeichert:

#### Datenstruktur:
```typescript
{
    eventId: number,            // ID des Events
    serviceId: number,          // ID des Dienstes
    userId: number,             // ID des Benutzers
    userName: string,           // Name des Benutzers (zur Lesbarkeit)
    response: 'yes' | 'maybe' | 'no' | null,  // Antwort des Benutzers
    comment: string,            // Optionaler Kommentar
    timestamp: string,          // Zeitstempel der ursprünglichen Eingabe (ISO 8601)
    editedBy: string,           // Name des Bearbeiters (Admin oder Mitarbeiter selbst)
    editedAt: string            // Zeitstempel der letzten Änderung (ISO 8601)
}
```

#### Storage-Hierarchie:
- **Modul**: `bwl-poll-event-services`
- **Kategorie**: `poll-responses`
- **Werte**: Ein Wert pro Event-Dienst-Benutzer-Kombination

#### Speicherverhalten:
- Pro Kombination aus `eventId`, `serviceId` und `userId` existiert genau ein Eintrag
- Mehrere Benutzer können unabhängig voneinander ihre Verfügbarkeit für denselben Dienst angeben
- Gibt ein Benutzer eine neue Antwort für einen bereits beantworteten Dienst ab, wird der bestehende Eintrag aktualisiert (nicht neu angelegt)
- `timestamp` bleibt unverändert (zeigt ursprüngliche Eingabe-Zeit)
- `editedBy` und `editedAt` werden bei jeder Änderung aktualisiert (Audit-Trail)
- `userName` wird mit jedem Update synchronisiert

#### Laden bestehender Eingaben:
- Beim Öffnen der Seite werden die gespeicherten Antworten des aktuellen Benutzers geladen
- Bereits beantwortete Dienste zeigen die gespeicherte Auswahl (Ja/Vielleicht/Nein) als aktiv an
- Gespeicherte Kommentare werden in die Kommentarfelder eingetragen
- Der Benutzer kann seine Eingaben jederzeit ändern

#### Anzeige von Antworten anderer Benutzer:
- Für jeden Dienst werden die Antworten aller Benutzer angezeigt
- Die Anzeige zeigt pro Antworttyp die Namen der Benutzer:
  - Ja: Liste der Benutzer, die zugesagt haben
  - Vielleicht: Liste der Benutzer, die "Vielleicht" angegeben haben
  - Nein: Liste der Benutzer, die abgesagt haben
- Kommentare anderer Benutzer werden ebenfalls angezeigt (sofern vorhanden)

#### Audit-Trail (Änderungsverlauf):
- `timestamp`: Zeigt, wann der Benutzer die Antwort ursprünglich eingegeben hat
- `editedAt`: Zeigt, wann die Antwort zuletzt geändert wurde (durch Benutzer oder Admin)
- `editedBy`: Zeigt, wer die Antwort zuletzt geändert hat
- Beispiel: Mitarbeiter gibt "Ja" ein (timestamp), Admin ändert später zu "Nein" (editedBy=Admin, editedAt=neueres Datum)

#### Anzeige bestehender Besetzungen:
- Bereits in ChurchTools eingetragene Besetzungen für einen Dienst werden angezeigt
- Die Anzeige unterscheidet zwischen:
  - Bestätigte Besetzungen (Person ist dem Dienst zugewiesen)
  - Offene Anfragen (Person wurde angefragt, aber noch nicht bestätigt)
- Ist ein Dienst bereits besetzt, wird dies deutlich gekennzeichnet

### 4. Benutzeroberfläche

#### Technologie:
- Das UI wird mit Vue 3 und PrimeVue erstellt
- PrimeVue liefert vorgefertigte UI-Komponenten (Buttons, Inputs, etc.)

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

#### Wireframe (Mobile-First):

```
┌──────────────────────────────┐
│ Dienst-Umfrage               │
├──────────────────────────────┤
│ So, 2.2.2025 - Gottesdienst  │
├──────────────────────────────┤
│ Lobpreis-Leitung             │
│ [✓ Ja] [? Vllt] [✗ Nein]     │
│ [Kommentar_______________]   │
│ Besetzt: Max M. ✓            │
│ Ja: Anna, Peter | ?: Lisa    │
│ 💬 Anna: "Nur bis 12 Uhr"    │
├──────────────────────────────┤
│ Keyboard                     │
│ [✓ Ja] [? Vllt] [✗ Nein]     │
│ [Kommentar_______________]   │
│ Offen | ?: Tom | ✗: Sarah    │
│ 💬 Tom: "Falls Auto klappt"  │
├──────────────────────────────┤
│ So, 9.2.2025 - Gottesdienst  │
│ ...                          │
└──────────────────────────────┘
```

- Buttons nebeneinander, touch-freundlich (min. 44px)
- Kompakte Darstellung der Antworten anderer
- Kommentare anderer unter den Antworten (nur wenn vorhanden)

#### Wireframe (Desktop):

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Dienst-Umfrage                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ So, 2.2.2025 - Gottesdienst                                                         │
├────────────────────┬────────────────────┬───────────────────┬───────────────────────┤
│ Dienst             │ Meine Antwort      │ Besetzung         │ Andere Antworten      │
├────────────────────┼────────────────────┼───────────────────┼───────────────────────┤
│ Lobpreis-Leitung   │ [✓] [?] [✗]        │ Max M. ✓          │ ✓ Anna, Peter         │
│                    │ [Kommentar____]    │                   │ ? Lisa: "Nur bis 12"  │
├────────────────────┼────────────────────┼───────────────────┼───────────────────────┤
│ Keyboard           │ [✓] [?] [✗]        │ Offen             │ ? Tom: "Falls Auto"   │
│                    │ [Kommentar____]    │                   │ ✗ Sarah               │
├────────────────────┴────────────────────┴───────────────────┴───────────────────────┤
│ So, 9.2.2025 - Gottesdienst                                                         │
├────────────────────┬────────────────────┬───────────────────┬───────────────────────┤
│ ...                │                    │                   │                       │
└────────────────────┴────────────────────┴───────────────────┴───────────────────────┘
```

- Tabellarische Darstellung für bessere Übersicht
- Alle Informationen auf einen Blick sichtbar
- Kommentare inline bei den Antworten

### 5. Sicherheit
- XSS-Schutz durch HTML-Escaping aller Benutzereingaben
- Authentifizierung über ChurchTools-Login
- Berechtigungsprüfung basierend auf Gruppenzugehörigkeit

## Technische Implementierung

### Algorithmus zur Ermittlung relevanter Services

Der Algorithmus bestimmt, welche Services dem Benutzer zur Umfrage angezeigt werden:

1. **Daten abrufen:**
   - Events im Zeitraum (Standard: nächste 90 Tage) mit `eventServices` laden
   - Aktuellen Benutzer via `/whoami` ermitteln
   - Gruppenmitgliedschaften des Benutzers laden
   - Masterdata mit allen Service-Definitionen laden

2. **Filterung der Services:**
   - Für jeden Event-Service die zugehörige Service-Definition aus Masterdata suchen
   - Prüfen, ob der Service Gruppen-Einschränkungen hat (`groupIds`)
   - Falls ja: Service nur anzeigen, wenn der Benutzer Mitglied in mindestens einer dieser Gruppen ist
   - Falls keine Gruppen-Einschränkung: Service anzeigen

3. **Filterung der Events:**
   - Events ohne relevante Services werden ausgeblendet
   - Nur Events mit mindestens einem für den Benutzer relevanten Service werden angezeigt

4. **Ergebnis:**
   - Liste von Events mit den jeweils für den Benutzer relevanten Services

### Architektur
Die Anwendung ist in mehrere Module aufgeteilt:

1. **types.ts**: TypeScript-Typdefinitionen
2. **pollService.ts**: Business-Logik für Event-Abruf, Datenspeicherung und Admin-Funktionen
3. **App.vue**: Haupt-Komponente mit TabView (Umfrage/Admin)
4. **components/**:
   - **EventCard.vue**: Darstellung eines Events mit seinen Services
   - **ServiceRow.vue**: Darstellung eines einzelnen Services mit Antwortoptionen
   - **AdminPanel.vue**: Admin-Bereich mit verschachtelter TabView
   - **AdminResponses.vue**: Verwaltung aller Umfrageantworten
   - **AdminConfig.vue**: Service-Konfiguration (Sichtbarkeit, Masterdata-Sync)
5. **exportService.ts**: Excel-Export-Funktionalität
6. **main.ts**: Haupteinstiegspunkt der Anwendung

### UI-Struktur:
```
App.vue (TabView)
├── Tab: Umfrage
│   ├── Zeitraum-Einstellungen (Datepicker, Tage)
│   ├── Excel Export Button
│   └── EventCard (für jedes Event)
│       └── ServiceRow (für jeden Service)
│           ├── Antwort-Buttons (Ja/Vielleicht/Nein)
│           ├── Kommentarfeld
│           └── Anzeige anderer Antworten
└── Tab: Admin (nur für Admins)
    └── AdminPanel (TabView)
        ├── Tab: Responses
        │   └── AdminResponses (Tabelle mit allen Antworten)
        ├── Tab: Service Config
        │   └── AdminConfig (Tabelle mit allen Services)
        └── Tab: Export
            └── Export-Statistik und Button
```

### API-Endpunkte
Die Erweiterung nutzt folgende ChurchTools-API-Endpunkte:

- `GET /events?from={date}&to={date}&include=eventServices` - Events mit Diensten abrufen
- `GET /whoami` - Aktuellen Benutzer abrufen
- `GET /persons/{personId}/groups` - Gruppenzugehörigkeiten abrufen
- `GET /event/masterdata` - Dienste und Dienst-Gruppen (Service Groups) abrufen
- `GET /calendars/appointments?calendar_ids[]={id}&from={date}&to={date}&include[]=bookings` - Ressourcen-Buchungen für Events
- ChurchTools Key-Value-Store API für Datenpersistierung:
  - Kategorie `poll-responses`: Umfrageantworten
  - Kategorie `admin-config`: Admin-Konfiguration (Service-Sichtbarkeit)

  ### Abhängigkeiten (package.json)
  - `vue`: ^3.5.27 - Vue.js Framework
  - `primevue`: ^4.5.4 - PrimeVue UI-Komponenten
  - `@primeuix/themes`: ^2.0.3 - PrimeVue Themes
  - `primeicons`: ^7.0.0 - Icon-Bibliothek
  - `vite`: ^7.3.1 - Build-Tool
  - `typescript`: ^5.9.2 - TypeScript-Compiler
  - `xlsx`: ^0.18.5 - Excel-Export-Bibliothek
  - `@churchtools/churchtools-client`: ^1.4.0 - ChurchTools API-Client
  - `@vitejs/plugin-vue`: ^6.0.3 - Vue Plugin für Vite
  - `rollup-plugin-visualizer`: ^6.0.5 - Build-Bundle-Analyse
  - `@types/node`: ^24.3.0 - Node.js Typen
  - `@playwright/test`: ^1.58.0 - E2E-Test-Framework

## Installation und Verwendung

### Voraussetzungen
- Node.js (v18+)
- npm
- Zugang zu einer ChurchTools-Instanz mit API-Zugriff
- CORS aktiviert für die Development-URL (für local development)

### Entwicklung
1. Repository klonen: `git clone <repo-url>`
2. `.env` Datei erstellen basierend auf `.env-example`
3. Abhängigkeiten installieren: `npm install`
4. Development-Server mit Hot-Reload starten: `npm run dev`
5. Lokal erreichbar unter `http://localhost:5173` (oder HTTPS für Safari)

#### Hinweise für lokale Entwicklung:
- **CORS-Konfiguration**: ChurchTools Admin > System Settings > Integrations > API > CORS
- **Safari-Probleme**: HTTP funktioniert nicht zuverlässig. Lösung:
  - Vite-Proxy konfigurieren (API-Calls gehen durch localhost)
  - Oder Dev-Server mit HTTPS laufen lassen (mit mkcert)

### Build
- Produktiv-Build erstellen: `npm run build`
- Build-Preview: `npm run preview`

### Deployment
1. Produktiv-Build erstellen und packen: `npm run deploy`
2. Package aus `releases/` Ordner in ChurchTools hochladen
3. Extension im Admin-Bereich aktivieren

### Testing
- E2E-Tests ausführen: `npm run test:e2e`
- Tests im UI-Modus: `npm run test:e2e:ui`
- Tests im Debug-Modus: `npm run test:e2e:debug`
- Tests mit Browser-Ansicht: `npm run test:e2e:headed`

## Konfiguration

### Environment-Variablen (.env)
```
VITE_KEY=bwl-poll-event-services                    # Extension Key (muss mit package.json übereinstimmen)
VITE_BASE_URL=https://ihre-instanz.church.tools     # URL der ChurchTools-Instanz
VITE_USERNAME=ihr-benutzername                      # Für Entwicklung (optional, für API-Tests)
VITE_PASSWORD=ihr-passwort                          # Für Entwicklung (optional, für API-Tests)
```

### Versionsverwaltung
- Aktuelle Version: **0.3.2** (siehe `package.json`)
- Version wird beim Deploy automatisch in das Package übernommen
- Für neue Releases: Version in `package.json` erhöhen

## Berechtigungen
Benutzer können nur Events und Dienste sehen, für die sie aufgrund ihrer Gruppenzugehörigkeit berechtigt sind.

### 6. Export für Disponenten
- Excel-Export aller Umfrageantworten für den gewählten Zeitraum
- Export enthält:
  - Event (Name, Datum)
  - Dienst
  - Benutzer
  - Antwort (Ja/Vielleicht/Nein)
  - Kommentar
  - Zeitstempel
- Ermöglicht dem Disponenten die Auswertung und Planung außerhalb der Extension

### 7. Admin-Funktionen
Die Extension bietet einen separaten Admin-Bereich für berechtigte Benutzer:

#### Admin-Berechtigung:
- Ein Benutzer ist Admin, wenn er Lesezugriff auf die KV-Store Kategorie "admin-config" hat
- Berechtigungen werden über das ChurchTools-Berechtigungssystem verwaltet
- Admin-Badge wird im Header angezeigt

#### Admin-Oberfläche:
- Separater Tab "Admin" (nur für Admins sichtbar)
- Verschachtelte TabView mit drei Unterbereichen:
  1. **Responses**: Übersicht aller Umfrageantworten
     - Tabellarische Darstellung aller Responses
     - Sortier- und Filterfunktionen
     - Bearbeitungs-Funktion für einzelne Antworten (Antwort, Kommentar ändern)
     - Löschfunktion für einzelne Antworten
     - Sichtbarkeit von Änderungsverlauf (editedBy, editedAt)
  2. **Service Config**: Konfiguration der Dienste
     - Anzeige ALLER Services aus ChurchTools Masterdata
     - Service-Namen und Kategorien (Service Groups) aus Masterdata
     - Spalten: Service ID, Kategorie, Service Name, Votes sichtbar
     - Toggle für Sichtbarkeit der Votes pro Service
     - Sortierung nach Kategorie, dann Service-Name
  3. **Export**: Excel-Export aller Antworten
     - Statistik (Anzahl Antworten, Anzahl Events)
     - Export-Button für alle Responses
     - Export enthält auch editedBy und editedAt für Audit-Trail

#### Service-Konfiguration:
- Alle Services werden aus den Event-Masterdata geladen
- Service-Namen und zugehörige Kategorien (Service Groups) werden automatisch synchronisiert
- Admin kann für jeden Service die Sichtbarkeit der Votes konfigurieren
- Konfiguration wird im KV-Store Kategorie "admin-config" gespeichert

## Zukünftige Erweiterungen (Optional)
- Filtermöglichkeiten (z.B. nur Events einer bestimmten Gruppe)
- Integration mit separater Disponenten-Extension
- Benachrichtigungen bei Änderungen
- Vereinfachte Disponenten-Ansicht
- Automatische Besetzungsvorschläge basierend auf Verfügbarkeit

## Projekt-Struktur (Zusammenfassung)

### Verzeichnisstruktur
```
src/
├── App.vue                    # Haupt-App mit Tab-Navigation (Umfrage/Admin)
├── main.ts                    # Einstiegspunkt, Vite + PrimeVue-Init
├── types.ts                   # Alle TypeScript-Typdefinitionen
├── pollService.ts             # Business-Logik (Events, Storage, Filtering)
├── exportService.ts           # Excel-Export-Funktionalität
├── components/
│   ├── EventCard.vue          # Event-Anzeige mit Services
│   ├── ServiceRow.vue         # Service-Zeile mit Antwort-Buttons
│   ├── AdminPanel.vue         # Admin-Tab mit verschachtelter Navigation
│   ├── AdminResponses.vue     # Responses-Management (Admin)
│   └── AdminConfig.vue        # Service-Config (Admin)
├── utils/
│   ├── kv-store.ts           # Key-Value-Store Wrapper
│   └── ct-types.d.ts         # ChurchTools API-Typen
```

### Ablauf: Event-Abruf und Filterung
1. **Event-Abruf**: `pollService.ts` -> ChurchTools API (`/events`)
2. **User-Info**: Benutzer via `/whoami` + Gruppen via `/persons/{id}/groups`
3. **Masterdata**: Service-Definitionen via `/event/masterdata`
4. **Filterung**: Nur Services, für die Benutzer berechtigt ist
5. **Speicherung**: Antworten im Key-Value-Store (poll-responses)

### Admin-Funktionen
- **Response-Verwaltung**: Alle Antworten einsehen/löschen
- **Service-Config**: Sichtbarkeit von Votes pro Service konfigurieren
- **Excel-Export**: Alle Responses exportieren

## Changelog

### Version 0.3.2 (aktuell)
- Excel-Export mit `xlsx` Library
- Verbesserte Error-Handling
- E2E-Tests mit Playwright
- Optimierte Performance

### Version 0.3.0
- Admin-Panel mit Response-Management
- Service-Konfiguration
- Verbesserte Benutzeroberfläche

### Version 0.2.0
- Event-Abruf und Filterung
- Umfrage-Interface (Ja/Vielleicht/Nein)
- Kommentar-Funktion
- Datenspeicherung im KV-Store
