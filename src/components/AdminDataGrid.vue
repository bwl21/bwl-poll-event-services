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

// Column definitions for revo-grid
const columns = computed(() => [
    { prop: 'eventName', name: 'Veranstaltung', width: 200, minWidth: 150, canResize: true },
    { prop: 'date', name: 'Datum', width: 110, minWidth: 100, canResize: true },
    { prop: 'time', name: 'Uhrzeit', width: 80, minWidth: 70, canResize: true },
    { prop: 'weekday', name: 'Wochentag', width: 120, minWidth: 100, canResize: true },
    { prop: 'serviceName', name: 'Dienst', width: 170, minWidth: 140, canResize: true },
    { prop: 'serviceCategoryName', name: 'Kategorie', width: 140, minWidth: 120, canResize: true },
    { prop: 'rooms', name: 'Raum', width: 120, minWidth: 100, canResize: true },
    { prop: 'userName', name: 'Person', width: 140, minWidth: 110, canResize: true },
    { prop: 'response', name: 'Zusage', width: 100, minWidth: 80, cellTemplate: (h: any, { value }: any) => {
        const displayMap: any = {
            yes: { label: 'Ja', color: '#4caf50' },
            maybe: { label: 'Vielleicht', color: '#ff9800' },
            no: { label: 'Nein', color: '#f44336' }
        };
        const display = displayMap[value] || { label: value || '-', color: '#999' };
        return h('span', {
            style: {
                backgroundColor: `${display.color}20`,
                color: display.color,
                padding: '3px 6px',
                borderRadius: '3px',
                fontWeight: 'bold',
                display: 'inline-block',
                fontSize: '0.8rem'
            }
        }, display.label);
    }, canResize: true },
    { prop: 'comment', name: 'Notiz', width: 180, minWidth: 140, canResize: true },
]);

// Update grid when data changes
watch(gridData, (newData) => {
    if (gridRef.value) {
        gridRef.value.source = newData;
    }
});

onMounted(async () => {
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
                :group-by="[]"
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
    padding: 12px;
    background: #f8f9fa;
    border-radius: 4px;
    flex-wrap: wrap;
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
