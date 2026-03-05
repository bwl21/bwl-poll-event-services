# Filter-Implementierung für Umfragenseite

## 📋 Übersicht

Implementierung von vier Filtertypen für die Umfragenseite:
1. **Dienste-Filter** (Mehrfachauswahl/Dropdown)
2. **Kategorien-Filter** (Mehrfachauswahl/Dropdown)
3. **Räume-Filter** (Mehrfachauswahl/Dropdown)
4. **Event-Filter** (Textsuche)

---

## 🎯 Anforderungen

### Funktionale Anforderungen
- Benutzer können nach Diensten filtern (mehrere auswählbar)
- Benutzer können nach Räumen filtern (mehrere auswählbar)
- Benutzer können Events nach Name/Nummer durchsuchen (Textfeld)
- Filter wirken sich **kombiniert** aus (AND-Logik)
- Filter sind **persistent** in der URL
- Filter sind **responsive** auf allen Geräten
- Filteranzeige zeigt Anzahl gefundener Events

### Nicht-Funktionale Anforderungen
- Performance: Filter sollten <100ms Reaktionszeit haben
- UX: Klare visuelle Rückmeldung welche Filter aktiv sind
- Accessibility: Vollständig mit Tastatur navigierbar
- Konsistenz: Ikonographie und Styling entspricht vorhandenem Design (PrimeVue)

---

## 📐 Datenstruktur & Datenquellen

### Verfügbare Daten
Aus bestehender App-Struktur:

```typescript
// Services pro Event
EventWithServices {
  id: number;
  name: string;
  startDate: string;
  services: ServiceInfo[] {
    id: number;
    name: string;
    serviceId: number;
    categoryName?: string;  // Service-Gruppen
    // ... weitere
  }
}

// Rooms/Ressourcen pro Event
EventWithServices {
  resources?: EventResource[] {
    name: string;
  }
}
```

### Filter-Quellen extrahieren
- **Dienste**: Aus `allEvents.flatMap(e => e.services)` → dedupliziert nach `serviceId` + `name`
- **Kategorien**: Aus `allEvents.flatMap(e => e.services)` → dedupliziert nach `categoryName` (Service-Gruppennamen)
- **Räume**: Aus `allEvents.flatMap(e => e.resources)` → dedupliziert nach `name`
- **Events**: Durchsucht in `event.name` + `event.startDate` (Datumsformatierung)

---

## 🏗️ Architektur

### Komponenten-Struktur

```
App.vue
├── FilterBar.vue
│   ├── ServiceFilter.vue
│   ├── CategoryFilter.vue
│   ├── RoomFilter.vue
│   └── EventSearch.vue
├── EventCard.vue
│   └── Filter wird auch auf Service-Level angewendet
```

### State-Management

In `App.vue`:
```typescript
// Filter-State
const filterServices = ref<number[]>([]);
const filterCategories = ref<string[]>([]);
const filterRooms = ref<string[]>([]);
const filterEventText = ref<string>('');

// Berechnete Properties
const filteredEvents = computed(() => {
  return visibleEvents.value.filter(event => {
    // 1. Event-Textsuche
    if (filterEventText.value) {
      const searchLower = filterEventText.value.toLowerCase();
      const nameMatch = event.name.toLowerCase().includes(searchLower);
      const dateMatch = formatDateOnly(event.startDate).includes(searchLower);
      if (!nameMatch && !dateMatch) return false;
    }

    // 2. Dienste-Filter (wenn ausgewählt)
    if (filterServices.value.length > 0) {
      const hasService = event.services.some(s =>
        filterServices.value.includes(s.serviceId)
      );
      if (!hasService) return false;
    }

    // 3. Kategorien-Filter (wenn ausgewählt)
    // ⚠️ WICHTIG: Filtert nur EVENTS, die mindestens eine Service mit der Kategorie haben!
    // Die einzelnen Services werden dann in EventCard.vue gefiltert
    if (filterCategories.value.length > 0) {
      const hasCategory = event.services.some((s) => {
        const categoryName = (s as any).categoryName;
        return categoryName && filterCategories.value.includes(categoryName);
      });
      if (!hasCategory) return false;
    }

    // 4. Räume-Filter (wenn ausgewählt)
    if (filterRooms.value.length > 0) {
      const hasRoom = event.resources?.some(r =>
        filterRooms.value.includes(r.name)
      );
      if (!hasRoom) return false;
    }

    return true;
  });
});

// Filter-Options generieren
const availableServices = computed(() => {
  const services = new Map<number, string>();
  for (const event of events.value) {
    for (const service of event.services) {
      services.set(service.serviceId, service.name);
    }
  }
  return Array.from(services.entries()).sort((a, b) => a[1].localeCompare(b[1], 'de'));
});

const availableCategories = computed(() => {
  const categories = new Set<string>();
  for (const event of events.value) {
    for (const service of event.services) {
      if ((service as any).categoryName) {
        categories.add((service as any).categoryName);
      }
    }
  }
  return Array.from(categories).sort((a, b) => a.localeCompare(b, 'de'));
});

const availableRooms = computed(() => {
  const rooms = new Set<string>();
  for (const event of events.value) {
    if (event.resources) {
      for (const resource of event.resources) {
        rooms.add(resource.name);
      }
    }
  }
  return Array.from(rooms).sort((a, b) => a.localeCompare(b, 'de'));
});
```

---

## 🎨 UI-Komponenten

### FilterBar.vue (Container)
- Responsive Flex-Layout
- Auf Mobile: Vertical Stack, auf Desktop: Horizontal
- Filter-Reset-Button
- Anzahl aktiver Filter anzeigen

```vue
<template>
  <div class="filter-bar">
    <div class="filter-controls">
      <ServiceFilter
        v-model="filterServices"
        :options="availableServices"
      />
      <RoomFilter
        v-model="filterRooms"
        :options="availableRooms"
      />
      <EventSearch
        v-model="filterEventText"
      />
    </div>
    
    <div class="filter-summary">
      <span v-if="activeFiltersCount > 0" class="badge">
        {{ activeFiltersCount }} Filter aktiv
      </span>
      <Button
        v-if="activeFiltersCount > 0"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="resetFilters"
        label="Zurücksetzen"
      />
      <span class="results-count">
        {{ filteredEventsCount }} Event{{ filteredEventsCount !== 1 ? 's' : '' }}
      </span>
    </div>
  </div>
</template>
```

### ServiceFilter.vue / RoomFilter.vue (Dropdowns)
- Nutzt PrimeVue `MultiSelect` Komponente
- Suchbar
- Alle/Keine-Buttons optional
- Icon: `pi-briefcase` (Services), `pi-home` (Rooms)

```vue
<template>
  <div class="filter-group">
    <label>Dienste</label>
    <MultiSelect
      v-model="selected"
      :options="options"
      optionLabel="label"
      optionValue="value"
      placeholder="Alle Dienste..."
      :showToggleAll="true"
      :maxSelectedLabels="2"
      :display="inline"
    />
  </div>
</template>
```

### EventSearch.vue (Textsuche)
- Einfaches InputText
- Placeholder: "Nach Event suchen..."
- Clear-Button (X) wenn Text vorhanden
- Icon: `pi-search`

---

## 🔗 URL-Parameter (Persistierung)

Filter sollten in URL-Parametern gespeichert werden für Shareability:

```
?start=2026-02-27&days=90
  &services=1,5,8                    // Dienst-IDs
  &categories=Programm,Technik       // Kategorienamen (URL-encoded)
  &rooms=Saal%20A,Saal%20B           // Raumnamen (URL-encoded)
  &search=Hochzeit                   // Suchetext (URL-encoded)
```

### URL-Handling
```typescript
// In loadData() und bei Filter-Änderungen
function updateURL() {
  const params = new URLSearchParams(window.location.search);
  
  if (filterServices.value.length > 0) {
    params.set('services', filterServices.value.join(','));
  } else {
    params.delete('services');
  }
  
  if (filterRooms.value.length > 0) {
    params.set('rooms', filterRooms.value.join(','));
  } else {
    params.delete('rooms');
  }
  
  if (filterEventText.value) {
    params.set('search', filterEventText.value);
  } else {
    params.delete('search');
  }
  
  window.history.replaceState({}, '', `?${params.toString()}`);
}

// Beim Start: Filter aus URL laden
function initFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  const servicesParam = params.get('services');
  if (servicesParam) {
    filterServices.value = servicesParam.split(',').map(Number);
  }
  
  const categoriesParam = params.get('categories');
  if (categoriesParam) {
    filterCategories.value = categoriesParam.split(',').map(decodeURIComponent);
  }
  
  const roomsParam = params.get('rooms');
  if (roomsParam) {
    filterRooms.value = roomsParam.split(',').map(decodeURIComponent);
  }
  
  const searchParam = params.get('search');
  if (searchParam) {
    filterEventText.value = decodeURIComponent(searchParam);
  }
}
```

---

## 💾 State-Persistierung (Optional: LocalStorage)

Alternative zu URL: LocalStorage für Benutzer-Voreinstellungen

```typescript
// localStorage Keys
const STORAGE_KEY_SERVICES = 'poll-filter-services';
const STORAGE_KEY_ROOMS = 'poll-filter-rooms';

function saveFiltersToLocalStorage() {
  localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(filterServices.value));
  localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(filterRooms.value));
}

function loadFiltersFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
  if (saved) filterServices.value = JSON.parse(saved);
  // Etc.
}
```

---

## 🔄 Filter-Logik Detail

### Kombinierte Filter (AND-Logik) - Event-Level
```
Event wird angezeigt, wenn:
  (Event-Suche PASST ODER keine Suche aktiv)
  AND
  (hat Dienst aus Filter ODER keine Dienste gefiltert)
  AND
  (hat Kategorie aus Filter ODER keine Kategorien gefiltert)
  AND
  (hat Raum aus Filter ODER keine Räume gefiltert)
```

### ⚠️ WICHTIG: Zwei-Ebenen-Filterung
1. **Event-Level (App.vue)**: Bestimmt, welche Events angezeigt werden
2. **Service-Level (EventCard.vue)**: Bestimmt, welche Services innerhalb eines Events angezeigt werden

**Beispiel:**
- Ereignis "Gottesdienst" hat Services: Predigt (Programm), Ton (Technik), Licht (Technik)
- Benutzer filtert: Category = "Programm"
- Ergebnis: Event wird angezeigt (hat mindestens eine Service mit Kategorie "Programm")
- Aber: Nur "Predigt" wird angezeigt, nicht "Ton" oder "Licht"

### Performance-Optimierung
- `computed()` mit Dependency-Tracking (automatisch optimiert)
- Filter werden nur neu berechnet wenn:
  - Filter-Werte ändern
  - `events` oder `visibleEvents` ändern
- **Nicht bei jeden Keystroke** neu filtern → Debounce für EventSearch

```typescript
import { useDebounceFn } from '@vueuse/core';

const debouncedSearch = useDebounceFn((value: string) => {
  filterEventText.value = value;
  updateURL();
}, 300); // 300ms Debounce
```

---

## 🎬 Implementierungs-Reihenfolge

### Phase 1: Basis-Filterlogik
- [x] State-Variablen in `App.vue` hinzufügen (Services, Categories, Rooms, EventText)
- [x] `availableServices`, `availableCategories`, `availableRooms` computed properties
- [x] `filteredEvents` computed property mit Filter-Logik
- [x] Event-Level Filterung mit AND-Logik

### Phase 2: UI-Komponenten
- [x] `FilterBar.vue` erstellen
- [x] `ServiceFilter.vue` mit PrimeVue MultiSelect
- [x] `CategoryFilter.vue` mit PrimeVue MultiSelect
- [x] `RoomFilter.vue` mit PrimeVue MultiSelect
- [x] `EventSearch.vue` mit InputText
- [x] Styling & Responsive-Layout
- [x] Tooltips mit ausgewählten Werten

### Phase 3: URL-Persistierung
- [x] `updateURL()` Funktion implementieren (Services, Categories, Rooms, Search)
- [x] `initFiltersFromURL()` beim Mount aufrufen
- [x] Filter-Änderungen → `updateURL()` triggern
- [x] URL-Encoding für Sonderzeichen (Räume, Kategorien)

### Phase 4: Service-Level Filterung (Kategorie-Filter)
- [x] `filterCategories` Parameter zu `EventCard.vue` hinzufügen
- [x] Service-Filterung in `sortedServices` computed property erweitern
- [x] Service-Filterung auch für andere Filter (Services) prüfen
- [x] Filter-Werte weitergeben von App.vue zu EventCard.vue

### Phase 5: Polish & Testing
- [x] Tooltips zeigen nur Werte, nicht Kriterium
- [x] Accessibility: ARIA-Labels, Keyboard-Navigation
- [x] Mobile-Responsivität testen
- [ ] Edge-Cases: Leere Filter, spezielle Zeichen in Kategorienamen

---

## 🧪 Test-Szenarien

- Filter einzeln: Service XY wählen → nur Events mit Service XY
- Filter kombiniert: Service XY + Raum Z wählen → nur Events mit BEIDEN
- Reset-Button: Alle Filter löschen
- URL-Sharing: Link mit Filtern kopieren, in neuem Tab öffnen → Filter laden
- Keine Ergebnisse: Message anzeigen wenn keine Events Match
- Accessibility: Mit Tab durch Filter navigieren

---

## 📱 Responsive Design

### Desktop (>768px)
```
[Service Filter]  [Room Filter]  [Event Search]  [Reset]  [3 Filter aktiv] [42 Events]
```

### Mobile (<768px)
```
[Service Filter]
[Room Filter]
[Event Search]
[Reset] [42 Events]
```

---

## 🔌 Abhängigkeiten

- **PrimeVue**: MultiSelect, InputText, Button (bereits vorhanden)
- **@vueuse/core**: useDebounceFn (optional, aber empfohlen)
- **Vue 3 Composition API**: Bereits in Verwendung ✓

---

## 📝 Notizen zur Implementierung

1. **Service-ID vs. Event-Service-ID**: 
   - `ServiceInfo` hat sowohl `id` (event-service-id) als auch `serviceId` (master-data-id)
   - Filter sollten auf `serviceId` basieren für Eindeutigkeit

2. **Räume/Ressourcen**:
   - Name ist eindeutig genug als Filter-Key
   - Falls nicht: Könnte ID hinzugefügt werden in Future

3. **Performance bei großen Datenmengen**:
   - Bei >1000 Events könnte virtuelle Scrolling nötig sein
   - Derzeit: OK mit `computed()` Properties

4. **Lokalisierung**:
   - "Dienste", "Räume", "Event suchen" sind deutsche Strings
   - Falls i18n geplant: In Konstanten auslagern

---

## 🐛 Troubleshooting & häufige Fehler

### Problem: Filter filtert Events, aber nicht einzelne Services
**Ursache**: Filter ist nur auf Event-Level implementiert, Services werden nicht gefiltert
**Lösung**: 
1. Prüfen, dass `filterServices` oder `filterCategories` zu `EventCard` Props hinzugefügt sind
2. In `EventCard.vue` `sortedServices` computed property prüfen:
```typescript
// Service-Level Filterung muss hier stattfinden
if (props.filterCategories && props.filterCategories.length > 0) {
  services = services.filter((service) => {
    const categoryName = (service as any).categoryName;
    return categoryName && props.filterCategories!.includes(categoryName);
  });
}
```

### Problem: Kategorien-Filter zeigt keine Werte
**Ursache**: Services haben keine `categoryName` Property
**Lösung**: In `pollService.ts` prüfen, dass Service-Gruppen-Namen gesetzt werden:
```typescript
const categoryName = serviceGroupMap.get((serviceDef as any)?.serviceGroupId) || undefined;
```

### Problem: Filter funktioniert, aber Tooltip zeigt nicht die ausgewählten Werte
**Ursache**: `getCategoryTooltip()` oder ähnliche Funktion fehlt in `FilterBar.vue`
**Lösung**: Tooltip-Funktion hinzufügen:
```typescript
function getCategoryTooltip(): string {
  if (props.modelValue.categories.length === 0) {
    return 'Nach Dienstkategorien filtern';
  }
  return props.modelValue.categories.join(', ');
}
const categoryTooltip = computed(() => getCategoryTooltip());
```

### Problem: URL-Parameter werden nicht geladen
**Ursache**: `initFiltersFromURL()` wird nicht aufgerufen oder Filter nicht aus URL extrahiert
**Lösung**: 
1. Sicherstellen, dass `initFiltersFromURL()` im `onMounted` Hook aufgerufen wird
2. Für jede Filter-Art URL-Parameter prüfen und laden

---

## 📚 Verwandte Dateien

- `src/App.vue` - Haupt-Komponente mit Filter-State & Event-Level Filterung
- `src/components/FilterBar.vue` - Filter-UI Container
- `src/components/ServiceFilter.vue` - Dienste-Filter Dropdown
- `src/components/CategoryFilter.vue` - Kategorien-Filter Dropdown
- `src/components/RoomFilter.vue` - Räume-Filter Dropdown
- `src/components/EventSearch.vue` - Event-Textsuche
- `src/components/EventCard.vue` - Event-Anzeige mit Service-Level Filterung
- `src/types.ts` - Type-Definitionen (ServiceInfo, EventWithServices)
- `src/pollService.ts` - Daten-Service (Kategorien-Mapping)
