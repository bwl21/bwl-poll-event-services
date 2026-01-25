# Handover: bwl-poll-event-services

## Status

Die Vue 3 + PrimeVue Migration ist abgeschlossen und funktioniert. PR #2 ist offen auf Branch `feature/vue3-primevue-migration`.

## Was wurde gemacht

### Migration von Vanilla JS zu Vue 3 + PrimeVue
- `src/ui.ts` entfernt
- Neue Vue-Komponenten: `App.vue`, `components/EventCard.vue`, `components/ServiceRow.vue`
- PrimeVue mit Aura-Theme für UI-Komponenten (DatePicker, Button, Card, etc.)

### API-Korrekturen
- `/persons/{id}/groupmemberships` → `/persons/{id}/groups` (alter Endpunkt existiert nicht)
- `/events/masterdata` → `/event/masterdata` (Singular)
- Gruppen-ID Extraktion: `group.domainIdentifier` statt `group.id`

### Neue Features
- Responsive Layout (Tabelle für Desktop, Cards für Mobile)
- Excel-Export (`xlsx` Library)
- URL-Parameter: `?start=YYYY-MM-DD&days=N`
- Versionsanzeige im Footer

## Bekannte Probleme

### Font-Fehler in Production
```
Failed to decode downloaded font: .../primeicons-C6QP2o4f.woff2
OTS parsing error: invalid sfntVersion
```
Die PrimeIcons-Font wird nicht korrekt geladen. Icons funktionieren trotzdem (Fallback). Mögliche Ursache: Build-Konfiguration oder ChurchTools-Upload.

## Offene Punkte aus REQUIREMENTS.md

- [ ] Anzeige bestehender Besetzungen (wer ist bereits eingetragen)
- [ ] Anzeige von Antworten anderer Benutzer
- [ ] Kommentare anderer Benutzer anzeigen

## Entwicklung

```bash
# .env mit ChurchTools-Credentials ausfüllen
cp .env-example .env

# Dev-Server starten
npm run dev -- --host

# Deploy-Package erstellen
npm run deploy
```

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/main.ts` | Vue App Bootstrap, ChurchTools Client Setup |
| `src/App.vue` | Hauptkomponente mit Zeitraum-Auswahl |
| `src/components/EventCard.vue` | Event-Karte mit Services |
| `src/components/ServiceRow.vue` | Service-Zeile mit Ja/Vielleicht/Nein Buttons |
| `src/pollService.ts` | API-Aufrufe, Filterlogik, KV-Store |
| `src/exportService.ts` | Excel-Export |
| `src/types.ts` | TypeScript-Typen |
| `src/utils/kv-store.ts` | ChurchTools KV-Store Wrapper |
