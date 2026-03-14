# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0] - März 2026

### ✨ Added

#### Core Features
- **Peer-Antworten Sichtbarkeit** - Mitarbeiter sehen jetzt, wer auf jeden Dienst Ja/Vielleicht/Nein geantwortet hat (mit Namen)
- **Service-Konfiguration Admin-Panel** - Neue Admin-UI zum Konfigurieren der Sichtbarkeit von Abstimmungen pro Service
- **Service-Kategorie Filter** - Neue Filter-Option in der Umfrage-Seite zum Filtern nach Service-Kategorien
- **Kommentare mit Anzeige** - Kommentare anderer Mitarbeiter werden mit deren Namen angezeigt

#### Admin-Panel Enhancements
- **Räume-Spalte** in Admin-Responses hinzugefügt (zeigt gebuchte Ressourcen)
- **Räume-Filter** - Neue Filter-Option zum Filtern von Events nach Raum/Ressourcen
- **Group-basierte Service-Filterung** - Toggle "Nur meine Services" für Admins zum Filtern nach eigenem Zugang
- **Kategorie-Filter im Admin-Panel** - Verwenden Sie Service-Kategorien zum Filtern in der Admin-Responses-Tabelle

#### Documentation
- **Documentation Index** - Neuer `docs/INDEX.md` für zentrale Dokumentations-Verweisung
- **Multiple Assignments Dokumentation** - Neue Dokumentation für mehrfache Dienst-Zuweisungen
- **Filter-Implementation Details** - Erweiterte Dokumentation mit Kategorie-Filter Details und Troubleshooting
- **ChurchTools Poll Docs Skill** - Neue Amp-Skill für automatische Dokumentations-Abfragen

### 🐛 Fixed

- ✅ Filter-Tooltips zeigen nur ausgewählte Werte, keine Kriterien-Labels
- ✅ Kategorie-Filter funktioniert auf Service-Level (nicht Event-Level)
- ✅ Kategorie-Filter behandelt korrekt `undefined` Kategorien
- ✅ Räume-Filter extrahiert Werte korrekt aus `event.resources` statt `service.roomNames`
- ✅ Magifying-Glass Icon aus Suchfeld entfernt

### 📊 Changed

- **ServiceRow.vue** - Andere Antworten und Kommentare werden jetzt angezeigt (wenn vom Admin konfiguriert)
- **AdminResponses.vue** - Hinzufügen von Räume-Spalte, Räume-Filter, Group-basierte Filterung
- **App.vue** - Integration von Kategorie-Filter in die Filterleiste
- **pollService.ts** - Neue Service-Konfiguration Logik für Vote-Visibility

### 🔒 Security

- Keine Sicherheitsänderungen. Alle bestehenden Authentifizierungs- und Autorisierungsmechanismen bleiben bestehen.

### 🔄 Migration

**Vollständig abwärtskompatibel mit v0.7.0**

- Alte Responses werden automatisch migriert
- Service-Konfiguration startet leer (alle Services standardmäßig sichtbar)
- Keine manuellen Daten-Migrationen erforderlich
- Bestehende URLs und Lesezeichen funktionieren weiterhin

---

## [0.7.0] - Januar 2026

### ✨ Added

- Vue 3 + PrimeVue Migration abgeschlossen
- Responsive Layout (Tabelle für Desktop, Cards für Mobile)
- Excel-Export mit `xlsx`-Bibliothek
- URL-Parameter Support: `?start=YYYY-MM-DD&days=N`
- Versionsanzeige im Footer
- Neue Filter-Features mit URL-Persistierung

### 🔧 Fixed

- API-Endpunkte korrigiert (`/persons/{id}/groups`, `/event/masterdata`)
- Gruppen-ID Extraktion (`group.domainIdentifier`)

### 📚 Technical Details

#### Dependencies (v0.8.0)
```json
{
  "vue": "^3.5.27",
  "primevue": "^4.5.4",
  "vite": "^7.3.1",
  "typescript": "^5.9.2",
  "xlsx": "^0.18.5",
  "@churchtools/churchtools-client": "^1.4.0",
  "@playwright/test": "^1.58.0"
}
```

#### Files Changed

**New/Modified Components:**
- ✨ `src/components/AdminConfig.vue` (NEW)
- 🔄 `src/components/ServiceRow.vue` (MODIFIED)
- 🔄 `src/components/AdminResponses.vue` (MODIFIED)
- 🔄 `src/App.vue` (MODIFIED)
- 🔄 `src/pollService.ts` (MODIFIED)

**Documentation:**
- ✨ `docs/INDEX.md` (NEW)
- ✨ `MULTIPLE_ASSIGNMENTS_HANDLING.md` (NEW)
- ✨ `RELEASE-0.8.0.md` (NEW)
- ✨ `CHANGELOG.md` (NEW)
- 🔄 `docs/FILTER-IMPLEMENTATION.md` (UPDATED)
- 🔄 `docs/REQUIREMENTS.md` (UPDATED)
- 🔄 `README.md` (UPDATED)

---

## Installation

```bash
# Version anschauen
cat package.json | grep version

# Build
npm run build

# Deploy
npm run deploy

# Test
npm run test:e2e
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/bwl21/bwl-poll-event-services/issues)
- **Documentation**: Siehe `docs/` Ordner
- **Release Notes**: Siehe `RELEASE-0.8.0.md`

---

## Version History

| Version | Release | Status |
|---------|---------|--------|
| 0.8.0 | März 2026 | ✅ Aktuell |
| 0.7.0 | Januar 2026 | 🔄 Unterstützt |
| 0.6.x | Dezember 2025 | ⏳ Legacy |

---

**Last Updated**: März 10, 2026
