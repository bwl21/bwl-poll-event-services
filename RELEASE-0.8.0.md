# Release Notes v0.8.0

**Version**: 0.8.0  
**Released**: März 2026  
**Previous Version**: 0.7.0

---

## 🎯 Highlights

### ✨ Neue Features

#### 1. **Peer-Antworten Sichtbarkeit** (Mitarbeiter-Seite)
- Mitarbeiter sehen jetzt, wer auf jeden Dienst **Ja**, **Vielleicht** oder **Nein** geantwortet hat
- Namen der Antwortenden werden angezeigt
- Kommentare anderer Mitarbeiter sind sichtbar

#### 2. **Service-Konfiguration** (Admin-Panel)
- Neu: **Service Config Tab** für Administratoren
- Pro Service einstellen: Sollen Votes (Antworten) sichtbar sein?
- Toggle: An/Aus
- Speicherung in ChurchTools Key-Value-Store

#### 3. **Service-Kategorie Filter** (Umfrage-Seite)
- Neue Filter-Option: Nach Service-Kategorien filtern
- Mehrfachauswahl möglich
- URL-Persistierung (URL-Sharing mit vorgesetzten Filtern)

#### 4. **Admin-Panel Enhancements**
- **Räume-Spalte** hinzugefügt (zeigt gebuchte Ressourcen)
- **Räume-Filter** (nur Events mit bestimmten Räumen zeigen)
- **Toggle "Nur meine Services"**: Admin sieht nur Services seiner Gruppen
- **Group-basierte Filterung**: Automatic Filtering nach Admin-Gruppenzugehörigkeit

---

## 📊 Tabelle: Was hat sich geändert

| Feature | v0.7.0 | v0.8.0 |
|---------|--------|--------|
| **Peer-Antworten sehen** | ❌ | ✅ |
| **Service-Konfiguration** | ❌ | ✅ |
| **Kategorie-Filter** | ❌ | ✅ |
| **Räume-Filter (Admin)** | ❌ | ✅ |
| **Admin Service-Visibility** | ❌ | ✅ |

---

## 🔧 Technical Details

### Code Changes
- **New Components:**
  - `AdminConfig.vue` - Service-Konfiguration UI
  
- **Modified Components:**
  - `ServiceRow.vue` - Andere Antworten anzeigen + Kommentare
  - `AdminResponses.vue` - Räume-Filter, Group-basierte Filterung
  - `App.vue` - Kategorie-Filter Integration
  - `pollService.ts` - Service-Config Logik

- **New Utilities:**
  - Service-Konfiguration Handling im `pollService.ts`
  - Vote-Visibility Settings Storage

### API Calls (keine neuen)
- Nutzt bestehende ChurchTools KV-Store APIs
- Neue Kategorie: `admin-config` für Service-Einstellungen

---

## 📝 Migration von 0.7.0

**Automatisch kompatibel** - keine Datenmigration nötig.

- Alte Responses bleiben erhalten
- Service-Config startet leer (alle Services standardmäßig sichtbar)
- Admins müssen Service-Sichtbarkeit manuell konfigurieren (falls gewünscht)

---

## 🐛 Bug Fixes

- ✅ Filter Tooltips zeigen nur ausgewählte Werte (keine Kriterien-Labels)
- ✅ Kategorie-Filter funktioniert auf Service-Level (nicht nur Event-Level)
- ✅ Räume-Filter extrahiert korrekt aus `event.resources`
- ✅ Magifying-Glass Icon aus Search-Input entfernt

---

## 📖 Documentation

- **USERMANUAL.md** - Aktualisiert mit neuen Features
- **FILTER-IMPLEMENTATION.md** - Kategorie-Filter dokumentiert
- **MULTIPLE_ASSIGNMENTS_HANDLING.md** - Neue Dokumentation
- **Dokumentations-Index** - Alle Docs zentral verlinkt

---

## 🚀 Installation & Deployment

### Für Entwickler
```bash
npm run build
npm run deploy
```

Package wird in `releases/` erstellt. ZIP in ChurchTools Admin hochladen.

### Für End-User
- Extension in ChurchTools aktualisieren
- Seite neu laden (Ctrl+F5 / Cmd+Shift+R)
- Keine zusätzliche Konfiguration nötig

---

## ✅ Testing

E2E-Tests aktualisiert für neue Features:
```bash
npm run test:e2e
```

Alle Tests erfolgreich ✓

---

## 🎓 Admin Quick Start

1. **Service-Sichtbarkeit konfigurieren:**
   - Admin Tab → Service Config
   - Toggle pro Service An/Aus
   - Speichern automatisch

2. **Responses verwalten:**
   - Admin Tab → Responses
   - Neue Räume-Spalte und Räume-Filter sichtbar
   - Toggle "Nur meine Services" zum Filtern

---

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/bwl21/bwl-poll-event-services/issues)
- **Documentation**: Siehe `docs/` und `README.md`

---

## 🙏 Danke

Vielen Dank für euer Feedback! Die Peer-Antworten Feature wurde basierend auf euren Anforderungen implementiert.

---

**Viel Erfolg mit v0.8.0!** 🎉
