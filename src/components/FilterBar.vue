<script setup lang="ts">
import { computed, ref } from 'vue';
import { watch } from 'vue';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import ServiceFilter from './ServiceFilter.vue';
import RoomFilter from './RoomFilter.vue';
import EventSearch from './EventSearch.vue';

const props = defineProps<{
  modelValue: {
    services: number[];
    rooms: string[];
    search: string;
  };
  availableServices: Array<[number, string]>;
  availableRooms: string[];
  filteredEventsCount: number;
  startDate: Date;
  days: number;
  showAssigned: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { services: number[]; rooms: string[]; search: string }): void;
  (e: 'update:startDate', value: Date): void;
  (e: 'update:days', value: number): void;
  (e: 'update:showAssigned', value: boolean): void;
  (e: 'reset'): void;
  (e: 'copy-url'): void;
}>();

const localStartDate = ref(props.startDate);
const localDays = ref(props.days);
const localShowAssigned = ref(props.showAssigned);

watch(() => props.startDate, (newVal) => {
  localStartDate.value = newVal;
});

watch(() => props.days, (newVal) => {
  localDays.value = newVal;
});

watch(() => props.showAssigned, (newVal) => {
  localShowAssigned.value = newVal;
});

const activeFiltersCount = computed(() => {
  return (props.modelValue.services.length > 0 ? 1 : 0) +
         (props.modelValue.rooms.length > 0 ? 1 : 0) +
         (props.modelValue.search.length > 0 ? 1 : 0);
});

function updateServices(services: number[]) {
  emit('update:modelValue', {
    ...props.modelValue,
    services,
  });
}

function updateRooms(rooms: string[]) {
  emit('update:modelValue', {
    ...props.modelValue,
    rooms,
  });
}

function updateSearch(search: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    search,
  });
}

function resetFilters() {
  emit('reset');
}

function handleDateSelect() {
  emit('update:startDate', localStartDate.value);
}

function handleDaysChange(value: number) {
  emit('update:days', value);
}

function handleAssignedChange(value: boolean) {
  emit('update:showAssigned', value);
}

function handleCopyUrl() {
  emit('copy-url');
}

function getServiceTooltip(): string {
  if (props.modelValue.services.length === 0) {
    return 'Nach Diensten filtern';
  }
  const selected = props.availableServices
    .filter(([id]) => props.modelValue.services.includes(id))
    .map(([, name]) => name)
    .join(', ');
  return `Dienste: ${selected}`;
}

function getRoomTooltip(): string {
  if (props.modelValue.rooms.length === 0) {
    return 'Nach Räumen filtern';
  }
  return `Räume: ${props.modelValue.rooms.join(', ')}`;
}

const serviceTooltip = computed(() => getServiceTooltip());
const roomTooltip = computed(() => getRoomTooltip());
</script>

<template>
  <div class="filter-bar">
    <div class="filter-row">
      <!-- Startdatum -->
      <div class="control-item date-item" v-tooltip="'Wähle das Startdatum für die Dienste'">
        <label for="filterStartDate" class="control-label">Startdatum</label>
        <DatePicker
          id="filterStartDate"
          v-model="localStartDate"
          date-format="dd.mm.yy"
          show-icon
          locale="de"
          :inline="false"
          @date-select="handleDateSelect"
          class="full-width"
        />
      </div>

      <!-- Tage -->
      <div class="control-item days-item" v-tooltip="'Anzahl der Tage ab dem Startdatum'">
        <label for="filterDays" class="control-label">Tage</label>
        <InputNumber
          id="filterDays"
          v-model="localDays"
          :min="1"
          :max="365"
          @update:model-value="handleDaysChange"
        />
      </div>

      <!-- Besetzte -->
      <div class="control-item toggle-item" v-tooltip="'Auch bereits besetzte Dienste anzeigen'">
        <label for="filterAssigned" class="control-label">Bes.</label>
        <ToggleSwitch
          id="filterAssigned"
          v-model="localShowAssigned"
          @update:model-value="handleAssignedChange"
        />
      </div>

      <!-- Dienste -->
      <div class="filter-item-wrapper" v-tooltip="serviceTooltip">
        <label class="filter-label-small">Dienste</label>
        <ServiceFilter
          :model-value="modelValue.services"
          :options="availableServices"
          @update:model-value="updateServices"
          class="flex-item"
        />
      </div>

      <!-- Räume -->
      <div class="filter-item-wrapper" v-tooltip="roomTooltip">
        <label class="filter-label-small">Räume</label>
        <RoomFilter
          :model-value="modelValue.rooms"
          :options="availableRooms"
          @update:model-value="updateRooms"
          class="flex-item"
        />
      </div>

      <!-- Event-Suche -->
      <div class="filter-item-wrapper search-wrapper" v-tooltip="'Nach Event-Namen oder Datum suchen'">
        <label class="filter-label-small">Event</label>
        <EventSearch
          :model-value="modelValue.search"
          @update:model-value="updateSearch"
          class="flex-item search-item"
        />
      </div>
    </div>

    <!-- Row 2: Summary & Controls -->
    <div class="filter-row row-summary">
      <div class="summary-left">
        <Button
          icon="pi pi-copy"
          label="Kopieren"
          severity="info"
          text
          size="small"
          @click="handleCopyUrl"
          class="copy-btn"
          v-tooltip="'Aktuelle URL mit allen Einstellungen kopieren'"
        />
      </div>
      <div class="summary-center">
        <span v-if="activeFiltersCount > 0" class="badge" v-tooltip="'Anzahl der aktiven Filter'">
          {{ activeFiltersCount }} Filter
        </span>
        <span class="results-count" v-tooltip="'Anzahl der angezeigten Events'">
          {{ filteredEventsCount }} Event{{ filteredEventsCount !== 1 ? 's' : '' }}
        </span>
      </div>
      <div class="summary-right">
        <Button
          v-if="activeFiltersCount > 0"
          icon="pi pi-times"
          label="Reset"
          text
          severity="secondary"
          @click="resetFilters"
          size="small"
          class="reset-btn"
          v-tooltip="'Alle Filter löschen'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  flex-wrap: nowrap;
  overflow-x: auto;
}

/* Control Items (Datum, Tage, Besetzte, Copy) */
.control-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.control-label {
  font-size: 0.7rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  height: 12px;
  display: flex;
  align-items: center;
}

.date-item {
  min-width: 200px;
  flex-shrink: 0;
}

.days-item {
  max-width: 60px;
  flex-shrink: 0;
}

.toggle-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: auto;
  flex-shrink: 0;
  align-items: flex-start;
  height: 52px;
  justify-content: space-between;
}

.toggle-item .control-label {
  text-align: left;
  padding: 0;
  height: 12px;
  display: flex;
  align-items: center;
  line-height: 1;
}

.toggle-item :deep(.p-toggleswitch) {
  margin: auto 0;
}

.copy-btn {
  flex-shrink: 0;
}

/* Filter Item Wrappers */
.filter-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 140px;
}

.search-wrapper {
  flex-grow: 2;
  min-width: 200px;
}

.filter-label-small {
  font-size: 0.7rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 2px;
  height: 12px;
  display: flex;
  align-items: center;
}

/* Filter Components (Dienste, Räume, Suche) */
.flex-item {
  flex-grow: 1;
  width: 100%;
}

.search-item {
  width: 100%;
}

/* Summary Row */
.row-summary {
  gap: 0;
  padding: 8px 12px;
  border-top: 1px solid #e9ecef;
  justify-content: flex-start;
  align-items: center;
}

.summary-left {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.summary-center {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-grow: 1;
  margin-left: 16px;
}

.summary-right {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.badge {
  font-size: 0.7rem;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.results-count {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.reset-btn {
  flex-shrink: 0;
}

/* PrimeVue component sizing */
:deep(.p-datepicker) {
  width: 100% !important;
}

:deep(.p-datepicker .p-inputtext) {
  width: 100% !important;
  padding: 8px 10px !important;
  font-size: 0.85rem !important;
  height: 38px !important;
}

:deep(.p-inputnumber) {
  width: 100% !important;
  max-width: 60px !important;
}

:deep(.p-inputnumber .p-inputnumber-input) {
  padding: 8px 10px !important;
  font-size: 0.85rem !important;
  height: 38px !important;
  width: 100% !important;
}

:deep(.p-toggleswitch) {
  height: 24px !important;
  width: 45px !important;
}

:deep(.p-toggleswitch .p-toggleswitch-slider) {
  height: 24px !important;
}

:deep(.p-button-sm) {
  padding: 6px 8px !important;
  font-size: 0.8rem !important;
  height: 36px !important;
}

:deep(.p-multiselect) {
  width: 100% !important;
  padding: 8px 10px !important;
  font-size: 0.85rem !important;
  height: 38px !important;
}

:deep(.p-inputtext) {
  padding: 8px 10px !important;
  font-size: 0.85rem !important;
  height: 38px !important;
}

/* Mobile */
@media (max-width: 1024px) {
  .filter-row {
    gap: 6px;
    padding: 10px;
  }

  .date-item {
    min-width: 160px;
  }

  .flex-item {
    min-width: 120px;
  }

  .search-item {
    min-width: 200px;
    flex-grow: 1;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    overflow-x: visible;
  }

  .control-item,
  .date-item,
  .days-item,
  .toggle-item {
    min-width: unset;
    width: 100%;
  }

  .copy-btn {
    align-self: flex-start;
  }

  .flex-item {
    min-width: unset;
    flex-grow: 0;
    width: 100%;
  }

  .search-item {
    min-width: unset;
    width: 100%;
  }

  .summary-controls {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }

  :deep(.p-datepicker .p-inputtext),
  :deep(.p-inputnumber .p-inputnumber-input),
  :deep(.p-inputtext) {
    height: 36px !important;
  }
}
</style>
