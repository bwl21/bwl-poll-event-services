# 📚 Dokumentations-Index

Schnelle Übersicht aller wichtigen Dokumentationen im Projekt.

---

## 🎯 Nach Thema

### Benutzer & Verwendung
- **[USERMANUAL.md](USERMANUAL.md)** - Handbuch für Mitarbeiter, Admins, Disponenten
  - Screenshots, Workflows, Features erklärt
- **[HANDOVER.md](HANDOVER.md)** - Übergabe-Dokumentation
  - Für neue Betreuer des Projekts

### Implementierung & Architektur
- **[FILTER-IMPLEMENTATION.md](FILTER-IMPLEMENTATION.md)** ⭐ **START HERE** für Filter-Fragen
  - Detaillierte Filter-Logik (Event-Level + Service-Level)
  - Zwei-Ebenen-Filterung erklärt
  - Troubleshooting & häufige Fehler
  - Code-Beispiele für Services, Kategorien, Räume
  
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Technische Anforderungen & API
  - ChurchTools API Struktur
  - Datentypen und Service-Definitionen

### Datenstrukturen & Konzepte
- **[../MULTIPLE_ASSIGNMENTS_HANDLING.md](../MULTIPLE_ASSIGNMENTS_HANDLING.md)** - Mehrfache Zuweisungen
  - Wie werden Services mit mehreren Slots behandelt?
  - Aktuelle Limitationen

- **[../key-value-store.md](../key-value-store.md)** - Key-Value-Store Dokumentation
  - Wie werden Daten in ChurchTools gespeichert?
  - Kategorie- und Key-Struktur

### Deployments & Releases
- **[../SCREENSHOT-GUIDE.md](../SCREENSHOT-GUIDE.md)** - Screenshots für Dokumentation
- **[../TEST-GUIDE.md](../TEST-GUIDE.md)** - Test-Übersicht
- **[../TEST-QUICK-START.md](../TEST-QUICK-START.md)** - Schneller Test-Start

---

## 🔍 Nach Problem/Frage

| Frage | Dokumentation |
|-------|---|
| Wie funktioniert der Filter? | [FILTER-IMPLEMENTATION.md](FILTER-IMPLEMENTATION.md) |
| Der Filter filtert nicht richtig! | [FILTER-IMPLEMENTATION.md#troubleshooting](FILTER-IMPLEMENTATION.md) → Troubleshooting-Sektion |
| Wie implementiere ich einen neuen Filter? | [FILTER-IMPLEMENTATION.md#architektur](FILTER-IMPLEMENTATION.md) → Komponenten-Struktur |
| Wie werden Kategorien extrahiert? | [FILTER-IMPLEMENTATION.md#datenstruktur](FILTER-IMPLEMENTATION.md) → Filter-Quellen |
| Was sind mehrfache Zuweisungen? | [../MULTIPLE_ASSIGNMENTS_HANDLING.md](../MULTIPLE_ASSIGNMENTS_HANDLING.md) |
| Wie nutze ich die ChurchTools API? | [REQUIREMENTS.md](REQUIREMENTS.md) |
| Wie werden Daten gespeichert? | [../key-value-store.md](../key-value-store.md) |
| Benutzerhandbuch für Endnutzer? | [USERMANUAL.md](USERMANUAL.md) |

---

## 📁 Dateistruktur

```
docs/
├── INDEX.md (⭐ Du bist hier!)
├── USERMANUAL.md
├── HANDOVER.md
├── FILTER-IMPLEMENTATION.md ⭐ Filter-Logik
├── REQUIREMENTS.md
├── USERMANUAL-SCREENSHOTS-TEMPLATE.md
└── screenshots/
    └── *.png (Screenshots für Handbuch)

Root/
├── MULTIPLE_ASSIGNMENTS_HANDLING.md ⭐ Mehrfache Zuweisungen
├── key-value-store.md ⭐ Datenspeicherung
├── TEST-GUIDE.md
├── TEST-QUICK-START.md
├── TEST-ROADMAP.md
└── ...
```

---

## ⚡ Häufigste Fragen

### "Der Filter funktioniert nicht!"
→ Siehe: **[FILTER-IMPLEMENTATION.md#troubleshooting](FILTER-IMPLEMENTATION.md)**
- Filter filtert Events, aber nicht Services?
- Kategorien zeigen keine Werte?
- Tooltip zeigt Werte nicht?

### "Wie implementiere ich einen Filter?"
→ Siehe: **[FILTER-IMPLEMENTATION.md](#architektur)**
- Komponenten-Struktur
- State-Management
- Filter-Logik (AND-Logik)
- URL-Persistierung

### "Wie werden Services und Kategorien geladen?"
→ Siehe: **[FILTER-IMPLEMENTATION.md#datenstruktur](FILTER-IMPLEMENTATION.md)**
- `pollService.ts` lädt Services mit Kategorien
- `availableCategories` computed property extrahiert Kategorien

### "Mehrfache Dienste-Zuweisungen?"
→ Siehe: **[../MULTIPLE_ASSIGNMENTS_HANDLING.md](../MULTIPLE_ASSIGNMENTS_HANDLING.md)**

---

## 💡 Tipps

1. **Bei Filter-Bugs**: Erst diese Checkliste prüfen:
   - Sind Kategorien in `availableCategories` vorhanden?
   - Wird `filterCategories` zu `EventCard` passed?
   - Sind Services in `EventCard.sortedServices` gefiltert?
   
2. **Neue Filter hinzufügen**: Siehe [FILTER-IMPLEMENTATION.md#implementierungs-reihenfolge](FILTER-IMPLEMENTATION.md)
   - 4 Schritte: State, UI, Filter-Logik, Tooltip

3. **Tests schreiben**: Siehe [../TEST-QUICK-START.md](../TEST-QUICK-START.md)

---

**Letzte Aktualisierung**: März 2026
