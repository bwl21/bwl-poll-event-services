<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { createLogger } from '../utils/logger';
import type { ServicePollEntry, EventWithServices } from '../types';
import { prepareResponseRows } from '../pollService';

const debugLog = createLogger('ADMIN-DATAGRID');

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

const gridRef = ref<any>(null);
const showEmptyServices = ref(true);
const globalFilter = ref('');
const groupByProps = ref<string[]>([]);
const expandedGroups = ref<boolean>(false);

// Load settings from localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem('admin-datagrid-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            groupByProps.value = settings.groupByProps || [];
            showEmptyServices.value = settings.showEmptyServices !== false;
            globalFilter.value = settings.globalFilter || '';
        }
    } catch (e) {
        debugLog('Failed to load settings:', e);
    }
}

// Save settings to localStorage
function saveSettings() {
    try {
        const settings = {
            groupByProps: groupByProps.value,
            showEmptyServices: showEmptyServices.value,
            globalFilter: globalFilter.value
        };
        localStorage.setItem('admin-datagrid-settings', JSON.stringify(settings));
    } catch (e) {
        debugLog('Failed to save settings:', e);
    }
}

// Watch for changes and save
watch([groupByProps, showEmptyServices, globalFilter], saveSettings, { deep: true });

// Prepare data for grid
const gridData = computed(() => {
    let rows = prepareResponseRows(props.events, props.responses, showEmptyServices.value);
    
    // Apply global filter
    if (globalFilter.value.trim()) {
        const filterLower = globalFilter.value.toLowerCase();
        rows = rows.filter(row =>
            (row.eventName?.toLowerCase().includes(filterLower)) ||
            (row.weekday?.toLowerCase().includes(filterLower)) ||
            (row.date?.toLowerCase().includes(filterLower)) ||
            (row.time?.toLowerCase().includes(filterLower)) ||
            (row.serviceName?.toLowerCase().includes(filterLower)) ||
            (row.rooms?.toLowerCase().includes(filterLower)) ||
            (row.userName?.toLowerCase().includes(filterLower)) ||
            (row.comment?.toLowerCase().includes(filterLower))
        );
    }
    
    return rows;
});

// All available columns (used for select options)
const allColumns = [
  { prop: 'eventName', name: 'Event', size: 200, minSize: 150, maxSize: 300, sortable: true },
  { prop: 'date', name: 'Datum', size: 110, minSize: 100, maxSize: 110, sortable: true },
  { prop: 'time', name: 'Zeit', size: 80, minSize: 80, maxSize: 80, sortable: true },
  { prop: 'weekday', name: 'Tag', size: 120, minSize: 120, maxSize: 120, sortable: true },
  { prop: 'serviceName', name: 'Dienst', size: 140, minSize: 140, maxSize: 200, sortable: true },
  { prop: 'serviceCategoryName', name: 'Kategorie', size: 140, minSize: 120, maxSize: 160, sortable: true },
  { prop: 'rooms', name: 'Raum', size: 120, minSize: 100, sortable: true },
  { prop: 'assignment', name: 'Besetzung', size: 140, minSize: 120, sortable: true },
  { prop: 'userName', name: 'Person', size: 140, minSize: 110, sortable: true },
  {
    prop: 'response',
    name: 'Zusage',
    size: 100,
    minSize: 80,
    sortable: true,
    cellTemplate: (h, { value }) => {
      const labelMap = {
        yes: 'Ja',
        maybe: 'Vielleicht',
        no: 'Nein'
      }
      const classMap = {
        yes: 'response-yes',
        maybe: 'response-maybe',
        no: 'response-no'
      }
      const label = labelMap[value] || '-'
      const responseClass = classMap[value] || 'response-empty'
      
      return h('span', {
        class: `response-badge ${responseClass}`
      }, label)
    }
  },
  { prop: 'comment', name: 'Notiz', size: 180, minSize: 140, sortable: true }
]

// Column definitions for revo-grid (filtered)
const columns = computed(() => {
    // Remove the grouped columns from display
    if (groupByProps.value.length > 0) {
        return allColumns.filter(col => !groupByProps.value.includes(col.prop));
    }
    
    return allColumns;
});

// Update grid when data changes
watch(gridData, (newData) => {
    if (gridRef.value) {
        gridRef.value.source = newData;
    }
});

// Drag & drop state
let draggedIndex: number | null = null;

function dragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
    }
}

function dragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
}

function dragDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
        const items = [...groupByProps.value];
        const draggedItem = items[draggedIndex];
        items.splice(draggedIndex, 1);
        items.splice(index, 0, draggedItem);
        groupByProps.value = items;
    }
}

function dragEnd() {
    draggedIndex = null;
}

function addGroupProp() {
    if (allColumns.length > groupByProps.value.length) {
        const unusedCol = allColumns.find(col => !groupByProps.value.includes(col.prop));
        if (unusedCol) {
            groupByProps.value = [...groupByProps.value, unusedCol.prop];
        }
    }
}

function removeGroupProp(index: number) {
    groupByProps.value = groupByProps.value.filter((_, i) => i !== index);
}

function updateGroupProp(index: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    groupByProps.value[index] = target.value;
    groupByProps.value = [...groupByProps.value];
}

async function closeAllGroups() {
    if (!gridRef.value || groupByProps.value.length === 0) {
        return;
    }
    
    // First set expandedAll to true to trigger a change
    expandedGroups.value = true;
    await nextTick();
    gridRef.value.grouping = {
        props: groupByProps.value,
        expandedAll: true,
        prevExpanded: {}
    };
    
    // Then immediately set it to false to collapse all
    await nextTick();
    expandedGroups.value = false;
    gridRef.value.grouping = {
        props: groupByProps.value,
        expandedAll: false,
        prevExpanded: {}
    };
}

// Grouping config
const groupingConfig = computed(() => {
    if (groupByProps.value.length === 0) {
        return {};
    }
    return {
        props: groupByProps.value,
        expandedAll: expandedGroups.value
    };
});

onMounted(async () => {
    loadSettings();
    await nextTick();
    
    if (gridRef.value) {
        gridRef.value.columns = columns.value;
        gridRef.value.source = gridData.value;
    }
});
</script>

<template>
    <div class="admin-datagrid">
        <div class="datagrid-header">
            <h3>
                <i class="pi pi-table"></i>
                Ergebnisse (RevoGrid)
            </h3>
            <p class="subtitle">Sortiere, filtere, gruppiere und ordne die Spalten an wie du möchtest.</p>
        </div>

        <div class="filter-controls">
            <div class="filter-item">
                <label>Globale Suche:</label>
                <input
                    v-model="globalFilter"
                    type="text"
                    class="search-input"
                    placeholder="Event, Service, Benutzer, etc."
                />
            </div>
            <div class="filter-item">
                <label>
                    <input
                        v-model="showEmptyServices"
                        type="checkbox"
                    />
                    Leere Services anzeigen
                </label>
            </div>
            <div class="grouping-container">
                <label class="grouping-label"><i class="pi pi-sitemap"></i> Gruppierung:</label>
                <div class="grouping-chips">
                    <div
                        v-for="(prop, index) in groupByProps"
                        :key="index"
                        class="grouping-chip"
                        draggable="true"
                        @dragstart="dragStart($event, index)"
                        @dragover="dragOver($event)"
                        @drop="dragDrop($event, index)"
                        @dragend="dragEnd"
                    >
                        <i class="pi pi-grip-vertical chip-drag-handle"></i>
                        <select :value="prop" @change="updateGroupProp(index, $event)" class="chip-select">
                            <option v-for="col in allColumns" :key="col.prop" :value="col.prop">
                                {{ col.name }}
                            </option>
                        </select>
                        <button @click="removeGroupProp(index)" class="chip-delete">
                            <i class="pi pi-times"></i>
                        </button>
                        <span v-if="index < groupByProps.length - 1" class="chip-arrow">></span>
                    </div>
                    
                    <button @click="addGroupProp" class="add-grouping-btn">
                        <i class="pi pi-plus"></i> Hinzufügen
                    </button>
                    <button v-if="groupByProps.length > 0" @click="closeAllGroups" class="close-groups-btn">
                        <i class="pi pi-compress"></i> Alle schließen
                    </button>
                </div>
            </div>
            <div class="stats">
                <span>{{ gridData.length }} Zeilen</span>
            </div>
        </div>

        <div class="grid-container">
            <div v-if="!gridData || gridData.length === 0" class="no-data">
                <p>Keine Daten verfügbar</p>
                <p style="font-size: 0.8rem; color: #999;">Responses: {{ responses.length }} | Events: {{ events.length }}</p>
            </div>
            <revo-grid
                v-else
                ref="gridRef"
                :columns="columns"
                :source="gridData"
                :resize="true"
                :row-headers="true"
                :filter="true"
                :sort="true"
                :grouping="groupingConfig"
                auto-size-column="true"
                @column-resize-start="onColumnResizeStart"
            />
        </div>
    </div>
</template>

<style scoped>
.admin-datagrid {
    padding: 20px;
}

.datagrid-header {
    margin-bottom: 20px;
}

.datagrid-header h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    color: #333;
}

.datagrid-header i {
    font-size: 1.2rem;
}

.subtitle {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
}

.filter-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    align-items: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
    flex-wrap: wrap;
    width: 100%;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-item label {
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 250px;
}

.search-input:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.grouping-select {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
    min-width: 200px;
    height: 38px;
}

.grouping-select:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.grouping-select-multiple {
    min-height: 80px !important;
}

.grouping-select-multiple option {
    padding: 4px 8px;
}

.clear-grouping-btn {
    padding: 6px 12px;
    margin-left: 8px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #856404;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.grouping-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f0f7ff;
    border: 1px solid #b3d9ff;
    border-radius: 4px;
    width: 100%;
}

.grouping-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    padding-top: 4px;
}

.grouping-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
}

.grouping-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: white;
    border: 1px solid #80c0ff;
    border-radius: 20px;
    cursor: move;
    transition: all 0.2s;
}

.grouping-chip:hover {
    background: #f0f8ff;
    border-color: #4da6ff;
}

.chip-drag-handle {
    cursor: grab;
    color: #999;
    font-size: 0.7rem;
}

.chip-select {
    border: none;
    background: transparent;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 2px 4px;
    min-width: 100px;
}

.chip-select:focus {
    outline: none;
}

.chip-delete {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 0;
    font-size: 0.8rem;
}

.chip-delete:hover {
    color: #f44336;
}

.chip-arrow {
    color: #999;
    font-size: 0.8rem;
    margin: 0 2px;
}

.add-grouping-btn {
    padding: 6px 12px;
    background: white;
    border: 1px dashed #80c0ff;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #0066cc;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
}

.add-grouping-btn:hover {
    background: #f0f8ff;
    border-color: #0066cc;
}

.close-groups-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid #ffb3b3;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #d32f2f;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
}

.close-groups-btn:hover {
    background: #ffebee;
    border-color: #d32f2f;
}

.stats {
    margin-left: auto;
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
}

.grid-container {
    border: 1px solid #dee2e6;
    border-radius: 4px;
    overflow: hidden;
    background: white;
    min-height: 600px;
    height: calc(100vh - 300px);
    max-height: 800px;
}

.no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 600px;
    color: #666;
}

.no-data p {
    margin: 0;
    padding: 4px 0;
}

/* RevoGrid base styling */
.grid-container :deep(revo-grid) {
    font-family: system-ui, -apple-system, sans-serif;
    background: white;
}

/* RevoGrid theme variables */
:deep(revo-grid) {
    --rgSize-headerHeight: 36px;
    --rgSize-rowHeight: 36px;
    --rgColor-headerBackground: #f8f9fa;
    --rgColor-headerBorder: #dee2e6;
    --rgColor-cellBorder: #e9ecef;
}

/* RevoGrid cell styling */
:deep(.rgCell) {
    padding: 10px 12px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
}

/* RevoGrid header styling */
:deep(.rgHeaderCell) {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    font-weight: 700;
    padding: 8px 12px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    min-height: 36px;
    width: 100%;
}

/* RevoGrid grouping - indent all group labels and their content rows */
:deep(.rgGroupLabel) {
    padding-left: 40px !important;
}

/* Apply additional indentation based on nesting level */
:deep(.rgRow[data-level="1"] .rgGroupLabel) {
    padding-left: 40px !important;
}

:deep(.rgRow[data-level="2"] .rgGroupLabel) {
    padding-left: 70px !important;
}

:deep(.rgRow[data-level="3"] .rgGroupLabel) {
    padding-left: 100px !important;
}

/* Regular data rows inherit proper indentation */
:deep(.rgRow .rgCell) {
    padding-left: 10px;
}

:deep(.rgRow[data-level="1"] .rgCell:first-child) {
    padding-left: 40px !important;
}

:deep(.rgRow[data-level="2"] .rgCell:first-child) {
    padding-left: 70px !important;
}

:deep(.rgRow[data-level="3"] .rgCell:first-child) {
    padding-left: 100px !important;
}

/* Response column styling */
:deep(.response-badge) {
    padding: 3px 6px;
    border-radius: 3px;
    font-weight: bold;
    display: inline-block;
    font-size: 0.8rem;
    min-width: 20px;
    text-align: center;
}

:deep(.response-yes) {
    background: #4caf5020;
    color: #4caf50;
}

:deep(.response-maybe) {
    background: #ff980020;
    color: #ff9800;
}

:deep(.response-no) {
    background: #f4433620;
    color: #f44336;
}

:deep(.response-empty) {
    background: #99920;
    color: #999;
}

@media (max-width: 768px) {
    .filter-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .search-input {
        min-width: unset;
    }

    .stats {
        margin-left: 0;
    }
}
</style>
