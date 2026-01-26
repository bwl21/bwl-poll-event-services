<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Toast from 'primevue/toast';

import EventCard from './components/EventCard.vue';
import AdminPanel from './components/AdminPanel.vue';
import {
    fetchEventsWithServices,
    loadAllPollResponses,
    getCurrentUser,
    getPollConfig,
    isUserAdmin,
} from './pollService';
import { exportToExcel } from './exportService';
import type { EventWithServices, ServicePollEntry, UserInfo } from './types';

// Debug logging controlled by ?debug URL parameter
const DEBUG = new URLSearchParams(window.location.search).has('debug');

function debugLog(...args: any[]): void {
    if (DEBUG) {
        console.log('[APP DEBUG]', ...args);
    }
}

const APP_VERSION = __APP_VERSION__;

const loading = ref(true);
const error = ref<string | null>(null);
const events = ref<EventWithServices[]>([]);
const allResponses = ref<ServicePollEntry[]>([]);
const currentUser = ref<UserInfo | null>(null);
const userIsAdmin = ref(false);

// Config from URL params or defaults
const config = getPollConfig();
const startDate = ref(new Date(config.startDate));
const days = ref(config.days);

const userResponses = computed(() => {
    if (!currentUser.value) return [];
    return allResponses.value.filter((r) => r.userId === currentUser.value!.id);
});

async function loadData() {
    loading.value = true;
    error.value = null;

    try {
        currentUser.value = await getCurrentUser();

        const startStr = startDate.value.toISOString().split('T')[0];
        const [eventsData, responsesData, adminStatus] = await Promise.all([
            fetchEventsWithServices(startStr, days.value),
            loadAllPollResponses(),
            isUserAdmin(),
        ]);

        events.value = eventsData;
        allResponses.value = responsesData;
        userIsAdmin.value = adminStatus;
        debugLog('User is admin:', adminStatus);
    } catch (e) {
        debugLog('Error loading data:', e);
        error.value =
            'Die Dienste konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
    } finally {
        loading.value = false;
    }
}

function handleResponseSaved(entry: ServicePollEntry) {
    // Update local state
    const idx = allResponses.value.findIndex(
        (r) =>
            r.eventId === entry.eventId &&
            r.serviceId === entry.serviceId &&
            r.userId === entry.userId
    );
    if (idx >= 0) {
        allResponses.value[idx] = entry;
    } else {
        allResponses.value.push(entry);
    }
}

function handleExport() {
    exportToExcel(events.value, allResponses.value);
}

function handleResponseDeleted(entry: ServicePollEntry) {
    // Remove deleted response from local state
    const idx = allResponses.value.findIndex(
        (r) =>
            r.eventId === entry.eventId &&
            r.serviceId === entry.serviceId &&
            r.userId === entry.userId
    );
    if (idx >= 0) {
        allResponses.value.splice(idx, 1);
    }
}

onMounted(loadData);
</script>

<template>
    <div class="poll-app">
        <Toast />
        <header class="poll-header">
            <div class="header-title">
                <h1>Dienste-Umfrage</h1>
                <span class="version">v{{ APP_VERSION }}</span>
                <span v-if="userIsAdmin" class="admin-badge">Admin</span>
            </div>
            <p class="subtitle">
                Bitte trage ein, für welche Dienste du verfügbar bist.
            </p>
          <p class="">
            Es werden die Dienste angezeigt die durch eine deiner Gruppen besetzt werden können,
          </p>
          <!-- Debug info when ?debug is in URL -->
          <div v-if="DEBUG" class="debug-info">
              <strong>Debug:</strong>
              User: {{ currentUser?.name }} (ID: {{ currentUser?.id }}) |
              Admin: {{ userIsAdmin ? 'Ja' : 'Nein' }} |
              Events: {{ events.length }} |
              Responses: {{ allResponses.length }}
          </div>
        </header>

        <div class="poll-controls">
            <div class="control-group">
                <label for="startDate">Startdatum</label>
                <DatePicker
                    id="startDate"
                    v-model="startDate"
                    dateFormat="dd.mm.yy"
                    showIcon
                    @date-select="loadData"
                />
            </div>
            <div class="control-group">
                <label for="days">Anzahl Tage</label>
                <InputNumber
                    id="days"
                    v-model="days"
                    :min="1"
                    :max="365"
                    showButtons
                    @update:modelValue="loadData"
                />
            </div>
            <div class="control-group export-btn">
                <Button
                    label="Excel Export"
                    icon="pi pi-file-excel"
                    severity="success"
                    @click="handleExport"
                    :disabled="events.length === 0"
                />
            </div>
        </div>

        <div v-if="loading" class="loading-container">
            <ProgressSpinner />
            <p>Dienste werden geladen...</p>
        </div>

        <Message v-else-if="error" severity="error" :closable="false">
            {{ error }}
        </Message>

        <div v-else-if="events.length === 0" class="empty-state">
            <i class="pi pi-calendar-times"></i>
            <p>
                Keine Dienste gefunden, die von Ihren Gruppen besetzt werden
                können.
            </p>
        </div>

        <div v-else class="events-list">
            <EventCard
                v-for="event in events"
                :key="event.id"
                :event="event"
                :all-responses="allResponses"
                :user-responses="userResponses"
                :current-user="currentUser!"
                @response-saved="handleResponseSaved"
            />
        </div>

        <!-- Admin Panel - only visible to admins -->
        <AdminPanel
            v-if="userIsAdmin && !loading"
            :responses="allResponses"
            :events="events"
            @response-deleted="handleResponseDeleted"
        />

        <footer class="app-footer">
        </footer>
    </div>
</template>

<style scoped>
.poll-app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    width: 100%;
    font-family: system-ui, -apple-system, sans-serif;
}

.poll-header {
    margin-bottom: 24px;
}

.header-title {
    display: flex;
    gap: 12px;
    align-items: baseline;
    margin-bottom: 8px;
}

.poll-header h1 {
    color: #333;
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
}

.version {
    font-size: 0.875rem;
    color: #999;
    font-weight: normal;
}

.admin-badge {
    font-size: 0.75rem;
    background-color: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
}

.debug-info {
    margin-top: 12px;
    padding: 8px 12px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #999;
    font-weight: normal;
}

.subtitle {
    color: #666;
    margin: 0;
    font-size: 0.95rem;
}

.poll-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: flex-end;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.control-group label {
    font-size: 0.875rem;
    color: #666;
}

.export-btn {
    margin-left: auto;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #666;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.empty-state i {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

@media (max-width: 768px) {
    .poll-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .export-btn {
        margin-left: 0;
        margin-top: 8px;
    }
}

.app-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 0.75rem;
    color: #999;
}
</style>
