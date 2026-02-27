# Filter-Feature - Benutzerleitfaden

## 🎯 Übersicht

Die Umfragenseite bietet nun drei Filter-Mechanismen zur Eingrenzung von Events:

1. **Dienste-Filter** - Mehrfachauswahl nach Service-Name
2. **Räume-Filter** - Mehrfachauswahl nach Raum/Ressourcen-Name
3. **Event-Suche** - Textsuche nach Event-Name oder Datum

---

## 📋 Verwendung

### Dienste-Filter
- Klick auf das Dropdown "Dienste"
- Mehrere Dienste sind wählbar (Checkboxen)
- Mit "Toggle All" alle Dienste on/off schalten
- Filter wählt nur die ausgewählten Dienste aus

**Beispiel:**
- Wähle: "Orgel", "Predigt" → Zeigt nur Events mit Orgel UND/ODER Predigt

### Räume-Filter
- Klick auf das Dropdown "Räume"
- Mehrere Räume sind wählbar
- Mit "Toggle All" alle Räume on/off schalten
- Filter wählt nur Events mit den ausgewählten Räumen

**Beispiel:**
- Wähle: "Saal A", "Kapelle" → Zeigt nur Events in Saal A ODER Kapelle

### Event-Suche
- Tipfe einen Suchtext ins "Event suchen"-Feld
- Sucht gleichzeitig nach:
  - **Event-Name** (z.B. "Hochzeit", "Taufe")
  - **Datum** (z.B. "27.02", "2026-02-27")
- Clear-Button (X) löscht schnell den Text

**Beispiel:**
- Suche "Hochzeit" → Zeigt alle Events mit "Hochzeit" im Namen
- Suche "27.02" → Zeigt alle Events am 27. Februar

---

## 🔄 Kombinierte Filter (AND-Logik)

Alle Filter wirken **kombiniert**:

```
Event wird angezeigt, wenn:
  (Dienst ausgewählt ODER keine Dienste gefiltert)
  UND
  (Raum ausgewählt ODER keine Räume gefiltert)
  UND
  (Suche in Name/Datum gefunden ODER kein Suchtext)
```

**Beispiel:**
- Dienst: "Orgel" ✓
- Raum: "Saal A" ✓
- Suche: "Hochzeit" ✓

→ Zeigt nur **Orgel-Events im Saal A mit "Hochzeit" im Namen**

---

## 📊 Filter-Anzeige

### Badge "X Filter aktiv"
- Zeigt an, wie viele Filter gerade aktiv sind
- Nur sichtbar wenn min. 1 Filter gesetzt

### "Zurücksetzen"-Button
- Löscht alle Filter auf einmal
- Nur sichtbar wenn min. 1 Filter gesetzt

### "42 Events"-Zähler
- Zeigt Anzahl der gefilterten/angezeigten Events
- Hilft zu sehen wie viele Events den Filtern entsprechen

---

## 🔗 URL-Persistierung

Filter werden automatisch in der **URL** gespeichert:

```
http://app.de/?start=2026-02-27&days=90
  &services=1,5,8           ← Service-IDs
  &rooms=Saal%20A,Saal%20B  ← Room-Namen (URL-encoded)
  &search=Hochzeit          ← Suchtext (URL-encoded)
```

### Sharing
Du kannst die URL mit aktiven Filtern kopieren und weitergeben:
- Click auf Copy-Button (Icon mit zwei Quadraten)
- Link wird mit **allen Einstellungen** kopiert
- Andere Benutzer sehen die gleichen Filter, wenn sie den Link öffnen

### Browser-Navigation
- **Zurück-Button** stellt vorherige Filter wieder her
- **Lesezeichen** speichern aktuelle Filter-Einstellung

---

## 🎨 Responsive Design

### Desktop (>768px)
```
[Dienste ▼] [Räume ▼] [Event suchen...] 
2 Filter aktiv | Zurücksetzen | 42 Events
```

### Mobile (<768px)
```
[Dienste ▼]
[Räume ▼]
[Event suchen...]
Zurücksetzen | 42 Events
```

---

## ⚡ Performance

- **Echtzeit-Filterung**: Keine Verzögerung sichtbar
- **Debounce auf Textsuche**: ~300ms Verzögerung bei Tippen (verhindert zu häufige Neuberechnungen)
- Große Datenmengen (>1000 Events) sind optimiert

---

## 🐛 Häufig Gestellte Fragen

### "Filter zeigt keine Optionen - warum?"
- Könnte sein, dass für den aktuellen Datumsbereich keine Dienste/Räume existieren
- Daten neu laden (F5) oder Startdatum ändern

### "Suche funktioniert nicht für alle Events"
- Suche umfasst nur **Event-Namen** und **Datumsangaben**
- Sucht nicht in Service-Namen oder Kommentaren
- Groß/Kleinschreibung wird nicht beachtet

### "Warum ist ein Service nicht im Dropdown?"
- Service ist nicht im aktuellen Datumsbereich vorhanden
- Service könnte deaktiviert sein (Admin-Setting)
- User hat keine Berechtigung für diesen Service (Gruppen-Zuordnung)

### "Filter vergessen wenn Seite neu geladen"
- Nein! Filter werden in der URL gespeichert
- Lesezeichen speichern auch die Filter-Einstellung
- Nur lokale Copy löst Filter nicht automatisch

---

## 🔧 Technische Details (für Admins)

### Filter-Logik
- Filter basieren auf `serviceId` (nicht auf `id`)
- Räume basieren auf `resource.name`
- Textsuche ist case-insensitive

### Beispiel-URLs

**Nur Orgel-Events:**
```
?start=2026-02-27&days=90&services=5
```

**Saal A oder Kapelle:**
```
?start=2026-02-27&days=90&rooms=Saal%20A,Kapelle
```

**Alles kombiniert:**
```
?start=2026-02-27&days=90&services=5,8&rooms=Saal%20A&search=Hochzeit
```

---

## 📝 Notizen

- Filter sind **nicht** persistent über Browser-Neustarts (nur in URL)
- Für lokale Speicherung müsste LocalStorage implementiert werden
- Filter wirken sich **nur auf Umfrage-Tab** aus (nicht auf Admin-Tab)

