# Release Notes v0.8.1

**Version**: 0.8.1  
**Released**: März 14 2026  
**Previous Version**: 0.8.0

---

## 🐛 Bugfixes

### 1. **URL-Pfad bei Kopieren erhalten**
- **Problem**: Beim Kopieren der URL via "Kopieren"-Button wurde der Extension-Basispfad verloren
  - Falsch: `https://bgkorntal.church.tools/?start=2026-03-14&days=90`
  - Richtig: `https://bgkorntal.church.tools/ccm/bwl-poll-event-services/?start=2026-03-14&days=90`
- **Lösung**: URL-Kopieren nutzt jetzt `window.location.href` statt `origin + pathname`
- **Impact**: Alle URL-Shares via Kopieren-Button funktionieren nun korrekt

### 2. **Screenshot-Erstellung stabilisiert**
- **Problem**: Screenshots zeigten manchmal alte oder gecachte App-Version
- **Lösung**:
  - `SCREENSHOTS=true` Umgebungsvariable triggert frischen Dev-Server (kein reuse)
  - Browser-Cache wird vor jedem Screenshot geleert
  - URL mit Timestamp-Parameter (`_cache_bust`) zur Cache-Invalidierung
  - Längere Waits (4s statt 3s) und Content-Visibility-Check
- **Impact**: Konsistente Screenshots, kein "falscher Screen von alter Version"

---

## 📦 Technische Änderungen

| Feature | Details |
|---------|---------|
| **URL-Handling** | `copyURLToClipboard()` in App.vue: `window.location.href.split('?')[0]` statt `origin + pathname` |
| **Screenshot Config** | `playwright.config.ts`: `reuseExistingServer` abhängig von `SCREENSHOTS` env var |
| **Screenshot Tests** | `screenshots.spec.ts`: Cache clearing, cache-bust URL params, bessere waitForAppReady() |
| **Package Script** | `npm run screenshots` setzt automatisch `SCREENSHOTS=true` |

---

## ✅ Verifikation

Nach diesem Release:
- ✓ URL-Kopieren behält Basispfad (z.B. `/ccm/bwl-poll-event-services/`)
- ✓ Screenshots zeigen korrekte aktuelle App-Version
- ✓ `npm run screenshots` startet frischen Dev-Server

---

## 📝 Changelog Entry

```
**0.8.1** | March 14, 2026
- 🐛 Fix: URL-Kopieren behält Extension-Basispfad
- 🐛 Fix: Screenshot-Erstellung mit frischem Dev-Server und Cache-Busting
- 📝 USERMANUAL.md aktualisiert auf Version 0.8.0
```
