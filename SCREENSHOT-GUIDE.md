# Screenshot Guide für Dokumentation

Dieses Dokument erklärt, wie du Screenshots für die USERMANUAL.md erstellst.

## 📸 Screenshots erstellen

### Schritt 1: Dev-Server starten
```bash
npm run dev
```
Der Server läuft auf `http://localhost:5173`

### Schritt 2: Screenshot-Tests ausführen
```bash
# Im Headed-Mode (mit Browser-Fenster sichtbar)
npm run test:e2e:headed -- screenshots.spec.ts
```

**Oder mit UI-Mode für bessere Kontrolle:**
```bash
npm run test:e2e:ui -- screenshots.spec.ts
```

### Schritt 3: Screenshots überprüfen
Screenshots werden in `docs/screenshots/` gespeichert:
```
docs/screenshots/
├── 01-mobile-umfrage-overview.png
├── 02-mobile-service-row.png
├── 03-mobile-admin-tab.png
├── 04-mobile-timerange-settings.png
├── 05-desktop-umfrage-overview.png
├── 06-desktop-table-view.png
├── 07-desktop-admin-responses.png
├── 08-desktop-admin-config.png
├── 09-desktop-admin-export.png
├── 10a-responsive-mobile-event.png
├── 10b-responsive-desktop-event.png
└── 11-tablet-umfrage-overview.png
```

## 🎨 Screenshots im USERMANUAL.md einfügen

### Beispiel: Mobile-Ansicht
```markdown
#### 📱 Mobile Darstellung

![Dienst-Umfrage Mobile - Übersicht](../docs/screenshots/01-mobile-umfrage-overview.png)

Die Extension passt sich automatisch an kleine Bildschirme an:
- Kompakte Darstellung
- Touch-freundliche Buttons (min. 44px)
- Einfaches Scrollen
```

### Beispiel: Desktop-Ansicht
```markdown
#### 🖥️ Desktop Darstellung

![Dienst-Umfrage Desktop - Tabellarische Ansicht](../docs/screenshots/05-desktop-umfrage-overview.png)

Auf Desktops wird eine tabellarische Ansicht verwendet:
- Alle Informationen auf einen Blick
- Sortier- und Filterfunktionen
- Breiteres Layout für bessere Übersicht
```

### Beispiel: Admin-Panel
```markdown
#### Admin Panel - Responses Tab

![Admin Responses](../docs/screenshots/07-desktop-admin-responses.png)

Im Responses-Tab sehen Sie:
- Tabellarische Übersicht aller Antworten
- Sortier- und Filtermöglichkeiten
- Bearbeitungs- und Lösch-Funktionen
```

## 🔧 Test-File anpassen

Wenn die UI sich ändert, kann der Screenshot-Test angepasst werden:

### Viewport-Größen ändern
```typescript
const DEVICES = {
  mobile: {
    viewport: { width: 390, height: 844 }  // iPhone 12
  },
  desktop: {
    viewport: { width: 1920, height: 1080 }  // Full HD
  }
};
```

### Neue Screenshots hinzufügen
```typescript
test('12-Desktop: Neue Funktion', async ({ page }) => {
  await page.setViewportSize(DEVICES.desktop.viewport);
  await page.goto('/');
  await page.waitForTimeout(500);
  
  // Navigiere zu neuer Funktion
  await page.click('[data-testid="new-feature"]');
  
  // Screenshot
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/12-desktop-new-feature.png`,
    fullPage: true
  });
});
```

## 💡 Best Practices

### ✅ Gute Screenshots
- **Konsistente Daten**: Verwende Test-Daten, nicht zufällige Daten
- **Vollständige Seite**: Nutze `fullPage: true` für komplette Ansicht
- **Aussagekräftig**: Screenshot sollte die Funktion klar zeigen
- **Beschreibt Zustand**: z.B. "mit gefülltem Kommentar", "mit Fehler"

### ❌ Zu vermeiden
- Screenshots mit leeren Felder (nicht aussagekräftig)
- Sensitive Daten (E-Mails, Telefonnummern)
- Zu viel Text in Screenshot (verwende Caption stattdessen)
- Unterschiedliche Viewports pro Feature (Konsistenz!)

### 📐 Viewport-Größen Übersicht
```
Mobil:   390 x 844 (iPhone 12)
Tablet:  768 x 1024 (iPad)
Desktop: 1920 x 1080 (Full HD)
```

## 🚀 Screenshots in CI/CD

Falls du CI/CD nutzt, können Screenshots automatisch generiert werden:

```yaml
# .github/workflows/screenshots.yml
name: Generate Screenshots

on: [push]

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e:headed -- screenshots.spec.ts
      - uses: actions/upload-artifact@v2
        with:
          name: screenshots
          path: docs/screenshots/
```

## 📖 Referenzen

- **Playwright Documentation**: https://playwright.dev/docs/screenshots
- **Test Best Practices**: https://playwright.dev/docs/best-practices
- **Image Assertions**: https://playwright.dev/docs/test-assertions#locator-to-have-screenshot

## ❓ Häufige Probleme

### Screenshot ist leer/weiß
**Problem**: Seite hat nicht vollständig geladen
**Lösung**: `await page.waitForSelector()` verwenden oder `waitUntil: 'networkidle'` setzen

### Screenshot ist abgeschnitten
**Problem**: `fullPage: false` ist gesetzt, aber du brauchst volle Seite
**Lösung**: Ändere zu `fullPage: true` oder erhöhe `waitForTimeout()`

### Tab-Navigation funktioniert nicht
**Problem**: Admin-Tab ist nicht sichtbar (z.B. bei Nicht-Admins)
**Lösung**: Test mit admin-Benutzer ausführen oder `.catch(() => {})` verwenden

---

**Viel Spaß beim Screenshot-Erstellen! 📸**
