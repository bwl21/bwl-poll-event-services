# Filter-Implementierung für Umfragenseite

## 📋 Übersicht

Implementierung von drei Filtertypen für die Umfragenseite:
1. **Dienste-Filter** (Mehrfachauswahl/Dropdown)
2. **Räume-Filter** (Mehrfachauswahl/Dropdown)
3. **Event-Filter** (Textsuche)

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
- **Räume**: Aus `allEvents.flatMap(e => e.resources)` → dedupliziert nach `name`
- **Events**: Durchsucht in `event.name` + `event.startDate` (Datumsformatierung)

---

## 🏗️ Architektur

### Komponenten-Struktur

```
App.vue
├── FilterBar.vue (NEU)
│   ├── ServiceFilter.vue (NEU)
│   ├── RoomFilter.vue (NEU)
│   └── EventSearch.vue (NEU)
├── EventCard.vue (UNVERÄNDERT)
```

### State-Management

In `App.vue`:
```typescript
// Filter-State
const filterServices = ref<number[]>([]); // IDs oder service-Indizes
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
        filterServices.value.includes(s.serviceId) ||
        filterServices.value.includes(s.id)
      );
      if (!hasService) return false;
    }

    // 3. Räume-Filter (wenn ausgewählt)
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
  &services=1,5,8        // Dienst-IDs
  &rooms=Saal%20A,Saal%20B
  &search=Hochzeit
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

### Kombinierte Filter (AND-Logik)
```
Event wird angezeigt, wenn:
  (Event-Suche ODER keine Suche)
  AND
  (hat Dienst aus Filter ODER keine Dienste gefiltert)
  AND
  (hat Raum aus Filter ODER keine Räume gefiltert)
```

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
- [ ] State-Variablen in `App.vue` hinzufügen
- [ ] `availableServices` & `availableRooms` computed properties
- [ ] `filteredEvents` computed property mit Filter-Logik
- [ ] Update `visibleEvents` Logik oder ersetzen durch `filteredEvents`

### Phase 2: UI-Komponenten
- [ ] `FilterBar.vue` erstellen
- [ ] `ServiceFilter.vue` mit PrimeVue MultiSelect
- [ ] `RoomFilter.vue` mit PrimeVue MultiSelect
- [ ] `EventSearch.vue` mit InputText
- [ ] Styling & Responsive-Layout

### Phase 3: URL-Persistierung
- [ ] `updateURL()` Funktion implementieren
- [ ] `initFiltersFromURL()` beim Mount aufrufen
- [ ] Filter-Änderungen → `updateURL()` triggern

### Phase 4: Polish & Testing
- [ ] Accessibility: ARIA-Labels, Keyboard-Navigation
- [ ] Mobile-Responsivität testen
- [ ] Performance-Optimierung (Debounce EventSearch)
- [ ] Edge-Cases: Leere Filter, spezielle Zeichen in Suchtext

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

## 📚 Verwandte Dateien

- `src/App.vue` - Haupt-Komponente
- `src/types.ts` - Type-Definitionen
- `src/components/EventCard.vue` - Event-Anzeige (wird gefiltert)
- `src/pollService.ts` - Daten-Service
