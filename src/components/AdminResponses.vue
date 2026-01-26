<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import type { ServicePollEntry, EventWithServices } from '../types';
import { deleteResponse } from '../pollService';

// Debug logging controlled by ?debug URL parameter
const DEBUG = new URLSearchParams(window.location.search).has('debug');

function debugLog(...args: any[]): void {
    if (DEBUG) {
        console.log('[ADMIN-RESPONSES DEBUG]', ...args);
    }
}

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

// Build lookup maps for quick access
const eventMap = new Map(props.events.map(e => [e.id, e]));
const serviceMap = new Map<number, { name: string; categoryName: string }>();
for (const event of props.events) {
    for (const service of event.services) {
        serviceMap.set(service.serviceId, {
            name: service.name,
            categoryName: event.name,
        });
    }
}
debugLog('Props events length:', props.events?.length || 0);
debugLog('Service map:', serviceMap);
debugLog('First response service IDs:', props.responses.slice(0, 3).map(r => r.serviceId));

const emit = defineEmits<{
    (e: 'response-deleted', entry: ServicePollEntry): void;
}>();

const toast = useToast();
const deleteDialogVisible = ref(false);
const selectedResponse = ref<ServicePollEntry | null>(null);
const deleting = ref(false);

const sortedResponses = computed(() => {
    return [...props.responses].sort((a, b) => {
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
});

function formatResponse(response: string | null): string {
    switch (response) {
        case 'yes':
            return 'Ja';
        case 'maybe':
            return 'Vielleicht';
        case 'no':
            return 'Nein';
        default:
            return '-';
    }
}

function formatWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
    });
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function confirmDelete(response: ServicePollEntry) {
    selectedResponse.value = response;
    deleteDialogVisible.value = true;
}

async function handleDelete() {
    if (!selectedResponse.value) return;

    deleting.value = true;
    try {
        await deleteResponse(
            selectedResponse.value.eventId,
            selectedResponse.value.serviceId,
            selectedResponse.value.userId
        );
        debugLog('Deleted response:', selectedResponse.value);
        emit('response-deleted', selectedResponse.value);
        toast.add({
            severity: 'success',
            summary: 'Gelöscht',
            detail: 'Antwort wurde erfolgreich gelöscht',
            life: 3000,
        });
    } catch (error) {
        console.error('Error deleting response:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Antwort konnte nicht gelöscht werden',
            life: 5000,
        });
    } finally {
        deleting.value = false;
        deleteDialogVisible.value = false;
        selectedResponse.value = null;
    }
}
</script>

<template>
    <div class="admin-responses">
        <DataTable
            :value="sortedResponses"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            stripedRows
            class="p-datatable-sm"
        >
            <Column field="eventId" header="Event" sortable style="min-width: 180px">
                <template #body="{ data }">
                    <span v-if="eventMap.has(data.eventId)" class="event-info">
                        {{ eventMap.get(data.eventId)?.name }}
                    </span>
                    <span v-else class="text-muted">-</span>
                </template>
            </Column>
            <Column header="Wochentag" sortable style="width: 100px">
                <template #body="{ data }">
                    <span v-if="eventMap.has(data.eventId)">
                        {{ formatWeekday(eventMap.get(data.eventId)?.startDate || '') }}
                    </span>
                    <span v-else class="text-muted">-</span>
                </template>
            </Column>
            <Column header="Datum" sortable style="width: 100px">
                <template #body="{ data }">
                    <span v-if="eventMap.has(data.eventId)">
                        {{ formatDate(eventMap.get(data.eventId)?.startDate || '') }}
                    </span>
                    <span v-else class="text-muted">-</span>
                </template>
            </Column>
            <Column header="Uhrzeit" sortable style="width: 80px">
                <template #body="{ data }">
                    <span v-if="eventMap.has(data.eventId)">
                        {{ formatTime(eventMap.get(data.eventId)?.startDate || '') }}
                    </span>
                    <span v-else class="text-muted">-</span>
                </template>
            </Column>
            <Column field="serviceId" header="Dienst" sortable style="min-width: 220px">
                <template #body="{ data }">
                    <span v-if="serviceMap.has(data.serviceId)" class="service-info">
                        <strong>{{ serviceMap.get(data.serviceId)?.categoryName }}</strong>: {{ serviceMap.get(data.serviceId)?.name }}
                    </span>
                    <span v-else class="text-muted">-</span>
                </template>
            </Column>
            <Column header="Besetzung" style="min-width: 150px">
                <template #body="{ data }">
                    <span class="text-muted">-</span>
                </template>
            </Column>
            <Column field="userName" header="Benutzer" sortable style="min-width: 130px">
                <template #body="{ data }">
                    {{ data.userName || `User ${data.userId}` }}
                </template>
            </Column>
            <Column field="response" header="Antwort" sortable style="width: 100px">
                <template #body="{ data }">
                    <span :class="['response-badge', `response-${data.response || 'none'}`]">
                        {{ formatResponse(data.response) }}
                    </span>
                </template>
            </Column>
            <Column field="comment" header="Kommentar" style="min-width: 180px">
                <template #body="{ data }">
                    {{ data.comment || '-' }}
                </template>
            </Column>
            <Column field="timestamp" header="Zeitstempel" sortable style="width: 140px">
                <template #body="{ data }">
                    {{ formatTimestamp(data.timestamp) }}
                </template>
            </Column>
            <Column header="Aktionen" style="width: 80px">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        @click="confirmDelete(data)"
                        title="Antwort löschen"
                    />
                </template>
            </Column>
        </DataTable>

        <Dialog
            v-model:visible="deleteDialogVisible"
            header="Antwort löschen"
            :modal="true"
            :closable="!deleting"
            :style="{ width: '400px' }"
        >
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--p-orange-500)"></i>
                <p>
                    Möchten Sie die Antwort von
                    <strong>{{ selectedResponse?.userName || `User ${selectedResponse?.userId}` }}</strong>
                    wirklich löschen?
                </p>
            </div>
            <template #footer>
                <Button
                    label="Abbrechen"
                    severity="secondary"
                    @click="deleteDialogVisible = false"
                    :disabled="deleting"
                />
                <Button
                    label="Löschen"
                    severity="danger"
                    icon="pi pi-trash"
                    @click="handleDelete"
                    :loading="deleting"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.admin-responses {
    padding: 16px 0;
}

.response-badge {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
}

.response-yes {
    background-color: #d4edda;
    color: #155724;
}

.response-maybe {
    background-color: #fff3cd;
    color: #856404;
}

.response-no {
    background-color: #f8d7da;
    color: #721c24;
}

.response-none {
    background-color: #e9ecef;
    color: #6c757d;
}

.confirmation-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.confirmation-content p {
    margin: 0;
}

.event-info {
    display: block;
    font-weight: 500;
}

.service-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.service-info strong {
    font-weight: 600;
    color: #333;
}

.text-muted {
    color: #999;
    font-style: italic;
}
</style>
