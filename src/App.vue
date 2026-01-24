<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

import EventCard from './components/EventCard.vue';
import {
    fetchEventsWithServices,
    loadAllPollResponses,
    getCurrentUser,
    getPollConfig,
} from './pollService';
import { exportToExcel } from './exportService';
import type { EventWithServices, ServicePollEntry, UserInfo } from './types';

const loading = ref(true);
const error = ref<string | null>(null);
const events = ref<EventWithServices[]>([]);
const allResponses = ref<ServicePollEntry[]>([]);
const currentUser = ref<UserInfo | null>(null);

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
        const [eventsData, responsesData] = await Promise.all([
            fetchEventsWithServices(startStr, days.value),
            loadAllPollResponses(),
        ]);

        events.value = eventsData;
        allResponses.value = responsesData;
    } catch (e) {
        console.error('Error loading data:', e);
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

onMounted(loadData);
</script>

<template>
    <div class="poll-app">
        <header class="poll-header">
            <h1>Dienste-Umfrage</h1>
            <p class="subtitle">
                Bitte geben Sie an, für welche Dienste Sie verfügbar sind.
            </p>
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
    </div>
</template>

<style scoped>
.poll-app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
}

.poll-header {
    margin-bottom: 24px;
}

.poll-header h1 {
    color: #333;
    margin: 0 0 8px 0;
}

.subtitle {
    color: #666;
    margin: 0;
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
</style>
