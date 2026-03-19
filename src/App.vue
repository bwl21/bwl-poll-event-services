<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { useToast } from 'primevue/usetoast';
import EventCard from './components/EventCard.vue';
import FilterBar from './components/FilterBar.vue';
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
import { getLocalDateString, formatDateOnly } from './utils/date';
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

// Filter state from URL params or defaults
const filterServices = ref<number[]>(
    urlParams.get('services')?.split(',').map(Number).filter(n => !isNaN(n)) || []
);
const filterCategories = ref<string[]>(
    urlParams.get('categories')?.split(',').map(decodeURIComponent) || []
);
const filterRooms = ref<string[]>(
    urlParams.get('rooms')?.split(',').map(decodeURIComponent) || []
);
const filterEventText = ref<string>(
    urlParams.get('search') ? decodeURIComponent(urlParams.get('search')!) : ''
);

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

// Available filter options
const availableServices = computed<Array<[number, string]>>(() => {
    const services = new Map<number, string>();
    for (const event of events.value) {
        for (const service of event.services) {
            if (!services.has(service.serviceId)) {
                services.set(service.serviceId, service.name);
            }
        }
    }
    // Sort alphabetically
    return Array.from(services.entries()).sort((a, b) => a[1].localeCompare(b[1], 'de'));
});

const availableCategories = computed<string[]>(() => {
    const categories = new Set<string>();
    for (const event of events.value) {
        for (const service of event.services) {
            if ((service as any).categoryName) {
                categories.add((service as any).categoryName);
            }
        }
    }
    // Sort alphabetically
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'de'));
});

const availableRooms = computed<string[]>(() => {
    const rooms = new Set<string>();
    for (const event of events.value) {
        if (event.resources) {
            for (const resource of event.resources) {
                rooms.add(resource.name);
            }
        }
    }
    // Sort alphabetically
    return Array.from(rooms).sort((a, b) => a.localeCompare(b, 'de'));
});

// Apply filters to visible events
const filteredEvents = computed(() => {
    return visibleEvents.value.filter((event) => {
        // 1. Event text search (name or date)
        if (filterEventText.value) {
            const searchLower = filterEventText.value.toLowerCase();
            const nameMatch = event.name.toLowerCase().includes(searchLower);
            const dateMatch = formatDateOnly(event.startDate).includes(searchLower);
            if (!nameMatch && !dateMatch) return false;
        }

        // 2. Services filter
        if (filterServices.value.length > 0) {
            const hasService = event.services.some((s) =>
                filterServices.value.includes(s.serviceId)
            );
            if (!hasService) return false;
        }

        // 3. Categories filter
        if (filterCategories.value.length > 0) {
            const hasCategory = event.services.some((s) => {
                const categoryName = (s as any).categoryName;
                return categoryName && filterCategories.value.includes(categoryName);
            });
            if (!hasCategory) return false;
        }

        // 4. Rooms filter
        if (filterRooms.value.length > 0) {
            const hasRoom = event.resources?.some((r) =>
                filterRooms.value.includes(r.name)
            );
            if (!hasRoom) return false;
        }

        return true;
    });
});

async function loadData() {
    const seq = ++loadSeq;
    loading.value = true;
    error.value = null;

    try {
        currentUser.value = await getCurrentUser();

        // Check admin status first, then load events with correct permissions
        const adminStatus = await isUserAdmin();
        
        if (seq !== loadSeq) return;
        
        userIsAdmin.value = adminStatus;
        debugLog('User is admin:', adminStatus);

        const startStr = getLocalDateString(startDate.value);
        const [eventsResult, responsesData] = await Promise.all([
            // Always load with normal filtering for survey page (admins see only their services)
            // Admin panel will have toggle to filter further
            fetchEventsWithServices(startStr, days.value, false),
            loadAllPollResponses(),
        ]);

        if (seq !== loadSeq) return;

        events.value = eventsResult.events;
        allResponses.value = responsesData;
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

function updateURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Preserve existing params
    const startStr = getLocalDateString(startDate.value);
    params.set('start', startStr);
    params.set('days', days.value.toString());
    params.set('showAssigned', showAssigned.value.toString());
    
    // Update filter params
    if (filterServices.value.length > 0) {
        params.set('services', filterServices.value.join(','));
    } else {
        params.delete('services');
    }
    
    if (filterCategories.value.length > 0) {
        params.set('categories', filterCategories.value.map(encodeURIComponent).join(','));
    } else {
        params.delete('categories');
    }
    
    if (filterRooms.value.length > 0) {
        params.set('rooms', filterRooms.value.map(encodeURIComponent).join(','));
    } else {
        params.delete('rooms');
    }
    
    if (filterEventText.value) {
        params.set('search', encodeURIComponent(filterEventText.value));
    } else {
        params.delete('search');
    }
    
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function handleFilterChange(filters: { services: number[]; categories: string[]; rooms: string[]; search: string }) {
    filterServices.value = filters.services;
    filterCategories.value = filters.categories;
    filterRooms.value = filters.rooms;
    filterEventText.value = filters.search;
    updateURL();
}

function resetFilters() {
    filterServices.value = [];
    filterCategories.value = [];
    filterRooms.value = [];
    filterEventText.value = '';
    updateURL();
}

function copyURLToClipboard() {
    // Get current full URL and only replace query params
    // This preserves the full path (e.g., /ccm/bwl-poll-event-services/)
    const params = new URLSearchParams(window.location.search);
    const baseURL = window.location.href.split('?')[0];
    const urlWithParams = `${baseURL}?${params.toString()}`;
    
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

                <FilterBar
                    :model-value="{ services: filterServices, categories: filterCategories, rooms: filterRooms, search: filterEventText }"
                    :available-services="availableServices"
                    :available-categories="availableCategories"
                    :available-rooms="availableRooms"
                    :filtered-events-count="filteredEvents.length"
                    :start-date="startDate"
                    :days="days"
                    :show-assigned="showAssigned"
                    @update:model-value="handleFilterChange"
                    @update:start-date="(date) => { startDate = date; loadData(); }"
                    @update:days="(value) => { days = value; loadData(); updateURL(); }"
                    @update:show-assigned="(value) => { showAssigned = value; updateURL(); }"
                    @reset="resetFilters"
                    @copy-url="copyURLToClipboard"
                />

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

                <div v-else-if="filteredEvents.length === 0" class="empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>Keine Events entsprechen den aktuellen Filtern.</p>
                </div>

                <div v-else class="events-list">
                     <EventCard
                         v-for="event in filteredEvents"
                         :key="event.id"
                         :event="event"
                         :all-responses="allResponses"
                         :user-responses="userResponses"
                         :current-user="currentUser!"
                         :show-assigned="showAssigned"
                         :filter-services="filterServices.length > 0 ? filterServices : undefined"
                         :filter-categories="filterCategories.length > 0 ? filterCategories : undefined"
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
    max-width: 1600px;
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
