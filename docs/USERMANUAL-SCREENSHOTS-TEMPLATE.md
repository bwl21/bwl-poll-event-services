# Screenshots Template für USERMANUAL.md

Verwende diese Vorlagen, um Screenshots in die USERMANUAL.md einzufügen.

## 📱 Mobile Screenshots

### Umfrage-Übersicht (Mobile)
```markdown
### Mobil vs. Desktop

#### 📱 Mobile Darstellung

![Dienst-Umfrage Mobile - Übersicht](../docs/screenshots/01-mobile-umfrage-overview.png)

**Optimiert für Smartphones und Tablets:**
- Schlanke Darstellung übereinander
- Buttons nebeneinander (leicht zu tippen)
- Scrollbares Layout für kleine Bildschirme
- Angepasste Schriftgrößen
```

### Service-Row (Mobile)
```markdown
#### Beispiel: Service-Zeile auf Mobile

![Service-Zeile Mobile](../docs/screenshots/02-mobile-service-row.png)

Jeder Dienst zeigt:
- Dienst-Name
- 3 Antwort-Buttons (Ja/Vielleicht/Nein) nebeneinander
- Kommentarfeld
- Antworten anderer (kompakt)
```

### Zeitraum-Einstellungen (Mobile)
```markdown
#### Zeitraum ändern

![Zeitraum-Einstellungen Mobile](../docs/screenshots/04-mobile-timerange-settings.png)

Oben auf der Seite können Sie:
- **Startdatum**: Mit Datepicker auswählen
- **Anzahl Tage**: Eingabefeld
- **OK-Button**: Zum Aktualisieren der Event-Liste
```

### Admin-Tab (Mobile)
```markdown
#### Admin-Bereich auf Mobile

![Admin Mobile](../docs/screenshots/03-mobile-admin-tab.png)

Der Admin-Tab ist auch auf Mobile verfügbar:
- Verschachtelte Tab-Navigation
- Alle Funktionen erhalten bleiben
- Optimierte Touch-Größen für Buttons
```

---

## 🖥️ Desktop Screenshots

### Umfrage-Übersicht (Desktop)
```markdown
#### 🖥️ Desktop Darstellung

![Dienst-Umfrage Desktop - Übersicht](../docs/screenshots/05-desktop-umfrage-overview.png)

**Tabellarische Ansicht mit optimiertem Layout:**
- Alle Informationen auf einen Blick
- 4 Spalten: Dienst | Meine Antwort | Besetzung | Andere Antworten
- Breiter für umfangreichere Informationen
- Sortierbar und filterbar
```

### Tabellarische Service-Ansicht (Desktop)
```markdown
#### Tabellen-Layout Desktop

![Service-Tabelle Desktop](../docs/screenshots/06-desktop-table-view.png)

Die tabellarische Darstellung zeigt pro Zeile:
1. **Dienst**: Service-Name
2. **Meine Antwort**: Antwort-Buttons + Kommentarfeld
3. **Besetzung**: Wer ist bereits gebucht?
4. **Andere Antworten**: Wer hat was gesagt? Mit Kommentaren
```

---

## 🛠️ Admin Panel Screenshots

### Admin: Responses Tab
```markdown
#### a) **Responses** - Alle Antworten verwalten

![Admin Responses Tab](../docs/screenshots/07-desktop-admin-responses.png)

Im Responses-Tab haben Sie:
- Tabellarische Übersicht aller Umfrageantworten
- **Spalten**: Event | Dienst | Benutzer | Antwort | Kommentar | Eingabe-Zeit | Bearbeitet von | Bearbeitungs-Zeit
- **Funktionen**:
  - Sortieren (Klick auf Spalten-Header)
  - Filtern (nach Event/Dienst/Benutzer)
  - **Bearbeiten** (Antwort oder Kommentar ändern)
  - **Löschen** (Antwort entfernen)
```

### Admin: Service Config Tab
```markdown
#### b) **Service Config** - Dienste konfigurieren

![Admin Service Config Tab](../docs/screenshots/08-desktop-admin-config.png)

Konfigurieren Sie hier:
- **Service-Liste**: Alle Services aus ChurchTools
- **Spalten**: Service-ID | Kategorie | Service-Name | Votes sichtbar
- **Toggle "Votes sichtbar"**:
  - ☑ **An** = Mitarbeiter sehen Antworten anderer
  - ☐ **Aus** = Nur bereits gebuchte Personen sichtbar
```

### Admin: Export Tab
```markdown
#### c) **Export** - Daten herunterladen

![Admin Export Tab](../docs/screenshots/09-desktop-admin-export.png)

Im Export-Tab finden Sie:
- **Statistik**: Anzahl Antworten, Anzahl Events
- **Excel-Export Button**: Für externe Auswertung
- **Export-Inhalt**:
  - Event, Dienst, Benutzer
  - Antwort (Ja/Vielleicht/Nein)
  - Kommentar
  - Timestamps (Eingabe + Bearbeitung)
```

---

## 📊 Responsive Vergleich

### Gleiche Event - Unterschiedliche Geräte
```markdown
#### Responsive Design: Mobile vs. Desktop

**Mobile (iPhone 12):**
![Mobile Event](../docs/screenshots/10a-responsive-mobile-event.png)

**Desktop (Full HD):**
![Desktop Event](../docs/screenshots/10b-responsive-desktop-event.png)

Die Extension passt sich automatisch an jeden Bildschirm an:
- **Mobile**: Vertikales Layout, Touch-optimiert
- **Desktop**: Tabellarisches Layout, mehr Informationen sichtbar
- **Tablet**: Hybridlayout (z.B. iPad)
```

### Tablet-Ansicht
```markdown
#### 📱 Tablet (iPad) Darstellung

![Tablet Übersicht](../docs/screenshots/11-tablet-umfrage-overview.png)

Auf Tablets wird ein Hybrid-Layout verwendet:
- Breiter als Mobile für bessere Nutzung
- Aber nicht so breit wie Desktop
- Optimale Balance zwischen Informationsdichte und Lesbarkeit
```

---

## 🎯 Integration ins USERMANUAL.md

### Wo einbauen?

1. **Nach "Mitarbeiter: Umfrage ausfüllen"**
   - Screenshots der Umfrage-Oberfläche
   - Mobile vs. Desktop Vergleich

2. **Bei "Schritt-für-Schritt Anleitung"**
   - Illustrationen der einzelnen Schritte

3. **Bei "Planer: Admin-Funktionen"**
   - Admin Panel Screenshots (Responses, Config, Export)

4. **Bei "FAQ & Fehlerbehebung"**
   - Screenshots zur Veranschaulichung von Problemen

### Syntax für Markdown
```markdown
![Beschreibung](../docs/screenshots/XX-name.png)

Oder mit Link:
[![Beschreibung](../docs/screenshots/XX-name.png)](../docs/screenshots/XX-name.png)
```

---

## ✅ Checkliste vor dem Einfügen

- [ ] Alle 12 Screenshots sind in `docs/screenshots/` vorhanden
- [ ] Bildgrößen sind angemessen (nicht zu groß, nicht zu klein)
- [ ] Screenshots sind beschriftet (Alt-Text in Markdown)
- [ ] Mobile und Desktop Vergleiche sind deutlich
- [ ] Admin-Screenshots zeigen alle 3 Tabs
- [ ] Keine sensiblen Daten in Screenshots sichtbar
- [ ] Links zu Screenshots sind korrekt (../docs/screenshots/...)

---

**Fertig? Dann ab in die USERMANUAL.md damit! 🚀**
