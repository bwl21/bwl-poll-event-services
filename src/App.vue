<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { useToast } from 'primevue/usetoast';
import EventCard from './components/EventCard.vue';
// Lazy load AdminPanel (only for admins)
const AdminPanel = defineAsyncComponent(() => import('./components/AdminPanel.vue'));
import {
    fetchEventsWithServices,
    loadAllPollResponses,
    getCurrentUser,
    getPollConfig,
    isUserAdmin,
} from './pollService';
import { exportToExcel } from './exportService';
import { createLogger } from './utils/logger';
import { getLocalDateString } from './utils/date';
import type { EventWithServices, ServicePollEntry, UserInfo } from './types';

const debugLog = createLogger('APP');
const DEBUG = new URLSearchParams(window.location.search).has('debug');

const APP_VERSION = __APP_VERSION__;
const toast = useToast();

const loading = ref(true);
const error = ref<string | null>(null);
const events = ref<EventWithServices[]>([]);
const allResponses = ref<ServicePollEntry[]>([]);
const currentUser = ref<UserInfo | null>(null);
const userIsAdmin = ref(false);
const activeTab = ref(0);
let loadSeq = 0;

// Config from URL params or defaults
const config = getPollConfig();
const startDate = ref(new Date(config.startDate));
const days = ref(config.days);
const urlParams = new URLSearchParams(window.location.search);
const showAssigned = ref(urlParams.get('showAssigned') === 'true');

const userResponses = computed(() => {
    if (!currentUser.value) return [];
    return allResponses.value.filter((r) => r.userId === currentUser.value!.id);
});

const visibleEvents = computed(() => {
    return events.value.filter((event) => {
        // When showAssigned is false (default): only show events with unassigned services
        if (!showAssigned.value) {
            return event.services.some(
                (service) => !service.assignments || service.assignments.length === 0
            );
        }
        // When showAssigned is true: show all events
        return true;
    });
});

async function loadData() {
    const seq = ++loadSeq;
    loading.value = true;
    error.value = null;

    try {
        currentUser.value = await getCurrentUser();

        const startStr = getLocalDateString(startDate.value);
        const [eventsResult, responsesData, adminStatus] = await Promise.all([
            fetchEventsWithServices(startStr, days.value),
            loadAllPollResponses(),
            isUserAdmin(),
        ]);

        if (seq !== loadSeq) return;

        events.value = eventsResult.events;
        allResponses.value = responsesData;
        userIsAdmin.value = adminStatus;
        debugLog('User is admin:', adminStatus);
    } catch (e) {
        if (seq !== loadSeq) return;
        debugLog('Error loading data:', e);
        error.value =
            'Die Dienste konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
    } finally {
        if (seq === loadSeq) {
            loading.value = false;
        }
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

function copyURLToClipboard() {
    // Get current settings
    const startStr = getLocalDateString(startDate.value);
    const baseURL = window.location.origin + window.location.pathname;
    const urlWithParams = `${baseURL}?start=${startStr}&days=${days.value}&showAssigned=${showAssigned.value}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(urlWithParams).then(() => {
        debugLog('URL copied to clipboard:', urlWithParams);
        toast.add({
            severity: 'success',
            summary: 'URL kopiert',
            detail: 'Link wurde in die Zwischenablage kopiert',
            life: 3000,
        });
    }).catch(() => {
        toast.add({
            severity: 'error',
            summary: 'Kopieren fehlgeschlagen',
            detail: 'URL konnte nicht kopiert werden',
            life: 5000,
        });
    });
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

function handleResponseSavedAdmin(entry: ServicePollEntry) {
    debugLog('handleResponseSavedAdmin called with:', entry);
    const idx = allResponses.value.findIndex(
        (r) =>
            r.eventId === entry.eventId &&
            r.serviceId === entry.serviceId &&
            r.userId === entry.userId
    );
    if (idx >= 0) {
        debugLog('Updating existing response at index', idx);
        allResponses.value[idx] = entry;
    } else {
        debugLog('Adding new response');
        allResponses.value.push(entry);
    }
    debugLog('allResponses now:', allResponses.value);
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
          <!-- Debug info when ?debug is in URL -->
          <div v-if="DEBUG" class="debug-info">
              <strong>Debug:</strong>
              User: {{ currentUser?.name }} (ID: {{ currentUser?.id }}) |
              Admin: {{ userIsAdmin ? 'Ja' : 'Nein' }} |
              Events: {{ events.length }} |
              Responses: {{ allResponses.length }}
          </div>
        </header>

        <TabView v-model:activeIndex="activeTab">
             <TabPanel>
                 <template #header>
                     <div v-tooltip="'Hier kannst du die Dienste für dich eintragen'">
                         <i class="pi pi-list mr-2"></i>
                         <span>Umfrage</span>
                     </div>
                 </template>
                
                <p class="subtitle">
                    Bitte trage ein, für welche Dienste du verfügbar bist.
                </p>
                <p class="info-text">
                    Es werden die Dienste angezeigt die durch eine deiner Gruppen besetzt werden können.
                </p>

                <div class="poll-controls">
                    <div class="control-group">
                         <label for="startDate" v-tooltip="'Startdatum für die Anzeige der Dienste'">Startdatum</label>
                         <DatePicker
                             id="startDate"
                             v-model="startDate"
                             dateFormat="dd.mm.yy"
                             showIcon
                             locale="de"
                             :inline="false"
                             @date-select="loadData"
                             v-tooltip="'Wähle das Startdatum für die Dienste aus'"
                         />
                     </div>
                     <div class="control-group">
                         <label for="days" v-tooltip="'Anzahl der Tage ab Startdatum'">Anzahl Tage</label>
                         <InputNumber
                             id="days"
                             v-model="days"
                             :min="1"
                             :max="365"
                             showButtons
                             @update:modelValue="loadData"
                             v-tooltip="'Gib die Anzahl der Tage ein (1-365)'"
                         />
                     </div>
                     <div class="control-group toggle-group">
                         <label for="showAssignedToggle">Auch besetzte anzeigen</label>
                         <ToggleSwitch 
                             id="showAssignedToggle"
                             v-model="showAssigned"
                             v-tooltip="'Auch Dienste anzeigen, die bereits besetzt sind'"
                         />
                     </div>
                     <div class="control-group">
                         <Button
                             icon="pi pi-copy"
                             severity="info"
                             text
                             rounded
                             @click="copyURLToClipboard"
                             v-tooltip="'Aktuelle URL mit Einstellungen in Zwischenablage kopieren'"
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
                         v-for="event in visibleEvents"
                         :key="event.id"
                         :event="event"
                         :all-responses="allResponses"
                         :user-responses="userResponses"
                         :current-user="currentUser!"
                         :show-assigned="showAssigned"
                         @response-saved="handleResponseSaved"
                     />
                 </div>
            </TabPanel>

            <TabPanel v-if="userIsAdmin">
                <template #header>
                    <div v-tooltip="'Admin-Funktionen zur Verwaltung von Umfragen und Konfiguration'">
                        <i class="pi pi-cog mr-2"></i>
                        <span>Admin</span>
                    </div>
                </template>
                
                <AdminPanel
                    v-if="!loading"
                    :responses="allResponses"
                    :events="events"
                    @response-deleted="handleResponseDeleted"
                    @response-saved="handleResponseSavedAdmin"
                    @config-changed="loadData"
                />
            </TabPanel>
        </TabView>

        <footer class="app-footer">
        </footer>
    </div>
</template>

<!-- Global tooltip styling (no scoped) -->
<style>
.v-popper--theme-tooltip .v-popper__inner {
    padding: 2px 4px !important;
    max-width: 200px;
    word-wrap: break-word;
    white-space: normal;
    text-align: center;
}
</style>

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
    margin: 0 0 8px 0;
    font-size: 0.95rem;
}

.info-text {
    color: #666;
    margin: 0 0 16px 0;
    font-size: 0.875rem;
}

.mr-2 {
    margin-right: 8px;
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

.toggle-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toggle-group label {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    white-space: nowrap;
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
