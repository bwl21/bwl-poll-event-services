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
- finales Speichern beim klick auf einen der drei Buttons

### 3. Datenspeicherung
Alle Antworten werden im ChurchTools Key-Value-Store gespeichert:

#### Datenstruktur:
```typescript
{
    eventId: number,        // ID des Events
    serviceId: number,      // ID des Dienstes
    userId: number,         // ID des Benutzers (ermöglicht mehrere Benutzer pro Umfrage)
    response: 'yes' | 'maybe' | 'no' | null,  // Antwort des Benutzers
    comment: string,        // Optionaler Kommentar
    timestamp: string       // Zeitstempel der letzten Änderung (ISO 8601)
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
- Der `timestamp` wird bei jeder Änderung aktualisiert

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
