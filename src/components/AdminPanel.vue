<script setup lang="ts">
import { ref } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import AdminResponses from './AdminResponses.vue';
import AdminConfig from './AdminConfig.vue';
import { exportToExcel } from '../exportService';
import { createLogger } from '../utils/logger';
import type { ServicePollEntry, EventWithServices } from '../types';

const debugLog = createLogger('ADMIN-PANEL');

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

const emit = defineEmits<{
    (e: 'response-deleted', entry: ServicePollEntry): void;
    (e: 'response-saved', entry: ServicePollEntry): void;
    (e: 'config-changed'): void;
}>();

const activeTab = ref(0);

function handleResponseDeleted(entry: ServicePollEntry) {
    debugLog('Response deleted:', entry);
    emit('response-deleted', entry);
}

function handleResponseSaved(entry: ServicePollEntry) {
    debugLog('Response saved:', entry);
    emit('response-saved', entry);
}

function handleExportAll() {
    debugLog('Exporting all responses');
    exportToExcel(props.events, props.responses);
}
</script>

<template>
    <div class="admin-panel">
        <div class="admin-header">
            <h2>
                <i class="pi pi-cog"></i>
                Admin Panel
            </h2>
        </div>

        <TabView v-model:activeIndex="activeTab">
            <TabPanel>
                <template #header>
                    <div v-tooltip="'Verwalte alle Antworten der Benutzer'">
                        <i class="pi pi-list mr-2"></i>
                        <span>Responses</span>
                    </div>
                </template>
                <AdminResponses
                    :responses="responses"
                    :events="events"
                    @response-deleted="handleResponseDeleted"
                    @response-saved="handleResponseSaved"
                />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <div v-tooltip="'Konfiguriere Services und ihre Sichtbarkeit'">
                        <i class="pi pi-sliders-h mr-2"></i>
                        <span>Service Config</span>
                    </div>
                </template>
                <AdminConfig :events="events" @config-changed="() => emit('config-changed')" />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <div v-tooltip="'Exportiere alle Daten als Excel-Datei'">
                        <i class="pi pi-file-excel mr-2"></i>
                        <span>Export</span>
                    </div>
                </template>
                <div class="export-panel">
                    <div class="export-info">
                        <i class="pi pi-info-circle"></i>
                        <p>Exportiert alle Antworten als Excel-Datei.</p>
                    </div>
                    <div class="export-stats">
                        <div class="stat">
                            <span class="stat-value">{{ responses.length }}</span>
                            <span class="stat-label">Antworten</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">{{ events.length }}</span>
                            <span class="stat-label">Events</span>
                        </div>
                    </div>
                    <Button
                         label="Excel Export (Alle Responses)"
                         icon="pi pi-file-excel"
                         severity="success"
                         size="large"
                         @click="handleExportAll"
                         :disabled="responses.length === 0"
                         v-tooltip="'Alle Antworten aller Benutzer als Excel-Datei exportieren'"
                     />
                </div>
            </TabPanel>
        </TabView>
    </div>
</template>

<style scoped>
.admin-panel {
    margin-top: 32px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.admin-header {
    margin-bottom: 16px;
}

.admin-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 1.25rem;
    color: #495057;
}

.mr-2 {
    margin-right: 8px;
}

.export-panel {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.export-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6c757d;
}

.export-info i {
    font-size: 1.25rem;
}

.export-info p {
    margin: 0;
}

.export-stats {
    display: flex;
    gap: 32px;
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: #212529;
}

.stat-label {
    font-size: 0.875rem;
    color: #6c757d;
}
</style>
