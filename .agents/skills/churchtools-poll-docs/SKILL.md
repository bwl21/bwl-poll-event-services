---
name: churchtools-poll-docs
description: Konsultiert Dokumentation des ChurchTools Poll-Projekts automatisch. Antwortet auf Fragen zu Filterlogik, mehrfachen Zuweisungen, Datenstrukturen. Nutze bei Entwicklungs- oder Implementierungsfragen.
---

# ChurchTools Poll Projekt - Dokumentations-Skill

Automatische Dokumentations-Konsultation für das BWL Poll Event Services Projekt.

## 🎯 Was dieser Skill macht

Wenn du Fragen zu diesem Projekt hast, konsultiere ich automatisch:
- **Filterlogik**: docs/FILTER-IMPLEMENTATION.md
- **Mehrfache Zuweisungen**: MULTIPLE_ASSIGNMENTS_HANDLING.md
- **Datenstrukturen**: docs/REQUIREMENTS.md, key-value-store.md
- **Benutzerhandbuch**: docs/USERMANUAL.md

## 📚 Dokumentationen

### Zentrale Übersicht
- **docs/INDEX.md** - Dokumentations-Index mit FAQ und Problemlösung
  - Nach Thema geordnet
  - "Nach Problem/Frage" Tabelle
  - Häufige Fehler & Lösungen

### Filter & Implementierung
- **docs/FILTER-IMPLEMENTATION.md** ⭐ **START HERE** für Filter-Fragen
  - Zwei-Ebenen-Filterung (Event-Level + Service-Level)
  - Event-Level Filterung in `App.vue`
  - Service-Level Filterung in `EventCard.vue`
  - Kategorien, Services, Räume, Textsuche
  - URL-Persistierung mit `categories` Parameter
  - **Troubleshooting-Sektion**:
    - "Filter filtert Events, aber nicht Services"
    - "Kategorien zeigen keine Werte"
    - "Tooltip zeigt nicht die ausgewählten Werte"
    - "URL-Parameter werden nicht geladen"

### Datenstrukturen
- **MULTIPLE_ASSIGNMENTS_HANDLING.md** - Mehrfache Service-Zuweisungen
  - Wie ChurchTools mehrfache Services liefert
  - Aktuelle Limitationen
  - Wie wird mit mehrfachen Slots umgegangen

- **key-value-store.md** - ChurchTools Key-Value-Store
  - Wo Daten gespeichert werden
  - Kategorie-Struktur
  - Datentypen

- **docs/REQUIREMENTS.md** - Technische Anforderungen
  - ChurchTools API Struktur
  - Event/Service/Resource Datentypen
  - ServiceInfo Properties

### Benutzer & Deployment
- **docs/USERMANUAL.md** - Benutzerhandbuch
  - Für Mitarbeiter, Admins, Planer
  - Screenshots, Workflows
  
- **docs/HANDOVER.md** - Übergabe-Dokumentation
  - Für neue Betreuer des Projekts

## 🔍 Automatische Recherche-Logik

Wenn du eine Frage stellst, konsultiere ich automatisch:

### 1. Filter-bezogene Fragen
- "Filter funktioniert nicht"
- "Wie implementiere ich einen neuen Filter?"
- "Kategorien zeigen keine Werte"
- "Filter filtert nicht richtig"

→ **Siehe**: docs/FILTER-IMPLEMENTATION.md → Troubleshooting

### 2. Datenstruktur-Fragen
- "Wie werden Services geladen?"
- "Wo ist categoryName?"
- "Wie funktionieren mehrfache Zuweisungen?"
- "Wie werden Daten gespeichert?"

→ **Siehe**: MULTIPLE_ASSIGNMENTS_HANDLING.md, key-value-store.md, docs/REQUIREMENTS.md

### 3. Implementierungs-Fragen
- "Wie baue ich das Feature X?"
- "Welche Komponenten sind beteiligt?"
- "Wo speichere ich die Konfiguration?"

→ **Siehe**: docs/FILTER-IMPLEMENTATION.md → Architektur, docs/REQUIREMENTS.md

### 4. Benutzer-Fragen
- "Was können Mitarbeiter machen?"
- "Wie nutze ich das Admin-Panel?"
- "Wie funktioniert der Excel-Export?"

→ **Siehe**: docs/USERMANUAL.md

## ⚡ Häufige Probleme & Lösungen

### Filter funktioniert nicht
1. Sind Daten in `availableCategories` vorhanden? 
   - Prüfe: `pollService.ts` → `serviceGroupMap` wird mit `categoryName` gefüllt
2. Wird Filter zu `EventCard` passed?
   - Prüfe: `App.vue` → `:filter-categories="filterCategories.length > 0 ? filterCategories : undefined"`
3. Filtert `EventCard` die Services?
   - Prüfe: `EventCard.vue` → `sortedServices` Computed Property

### Kategorien zeigen keine Werte
- Kategorien kommen aus `service.categoryName`
- Gesetzt in `pollService.ts` Zeile 248: `const categoryName = serviceGroupMap.get((serviceDef as any)?.serviceGroupId)`
- Prüfe: Werden Service-Gruppen in ChurchTools korrekt konfiguriert?

### URL-Parameter funktionieren nicht
- Kategorien-Parameter: `?categories=Programm,Technik` (URL-encoded)
- Loaded in `App.vue`: `filterCategories.value = urlParams.get('categories')?.split(',').map(decodeURIComponent) || []`
- Aktualisiert in: `updateURL()` Funktion

## 🛠️ Komponenten-Übersicht

```
App.vue (Filter-State & Event-Level Filterung)
├── FilterBar.vue (UI)
│   ├── ServiceFilter.vue
│   ├── CategoryFilter.vue
│   ├── RoomFilter.vue
│   └── EventSearch.vue
├── EventCard.vue (Service-Level Filterung)
│   └── ServiceRow.vue

Daten-Layer:
├── pollService.ts (Services mit categoryName laden)
└── types.ts (ServiceInfo, EventWithServices)
```

## 💡 Tipps

1. **2-Ebenen-Filterung verstehen**:
   - App.vue: Welche Events werden angezeigt?
   - EventCard.vue: Welche Services innerhalb des Events werden angezeigt?

2. **Debugging**:
   - Browser Console öffnen: `?debug` in URL
   - Dann: `filterCategories` prüfen
   - Prüfen: `event.services[0].categoryName` vorhanden?

3. **Neue Filter hinzufügen**:
   - Folge: docs/FILTER-IMPLEMENTATION.md → Implementierungs-Reihenfolge
   - 4 Phasen: State, UI, Event-Filter, Service-Filter

## 🔗 Quick Links

- **Ganz neu?** → Starte mit docs/INDEX.md
- **Filter-Problem?** → docs/FILTER-IMPLEMENTATION.md → Troubleshooting
- **Code-Beispiel?** → docs/FILTER-IMPLEMENTATION.md → Datenstruktur
- **Benutzer-Hilfe?** → docs/USERMANUAL.md

---

**Stand**: März 2026
