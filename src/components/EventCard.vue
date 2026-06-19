<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ServiceRow from './ServiceRow.vue';
import { deleteResponsesForEvent, savePollResponse } from '../pollService';
import { createLogger } from '../utils/logger';
import type {
    EventWithServices,
    PollResponse,
    ServiceInfo,
    ServicePollEntry,
    UserInfo,
} from '../types';

const debugLog = createLogger('EVENT-CARD');

const props = defineProps<{
    event: EventWithServices;
    allEvents: EventWithServices[];
    allResponses: ServicePollEntry[];
    userResponses: ServicePollEntry[];
    currentUser: UserInfo;
    showAssigned: boolean;
    filterServices?: number[];
    filterCategories?: string[];
}>();

const emit = defineEmits<{
    (e: 'response-saved', entry: ServicePollEntry): void;
    (e: 'responses-deleted', eventId: number, deletedCount: number): void;
}>();
const toast = useToast();
const bulkActionLoading = ref<'event' | 'day' | 'delete' | null>(null);

const eventDay = computed(() => props.event.startDate.slice(0, 10));

const dayServicesCount = computed(() =>
    props.allEvents
        .filter((event) => event.startDate.slice(0, 10) === eventDay.value)
        .reduce((count, event) => count + event.services.length, 0)
);

function openEventInChurchTools() {
    // Get base URL and window name from globals set in main.ts
    const baseUrl = (window as any).CT_BASE_URL;
    const windowName = (window as any).CT_WINDOW_NAME;
    const eventUrl = `${baseUrl}?q=churchservice&id=${props.event.id}#ListView`;
    window.open(eventUrl, windowName);
}

const formattedDate = computed(() => {
    const date = new Date(props.event.startDate);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });
});

const formattedTime = computed(() => {
    const date = new Date(props.event.startDate);
    return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });
});

const resourceNames = computed(() => {
    if (!props.event.resources || props.event.resources.length === 0) {
        return '';
    }
    debugLog('Resources for event', props.event.id, ':', props.event.resources);
    return props.event.resources.map((r) => r.name).join(', ');
});

function groupDuplicateServices(services: ServiceInfo[]): ServiceInfo[] {
    const grouped = new Map<number, ServiceInfo>();

    for (const service of services) {
        const existing = grouped.get(service.serviceId);
        if (!existing) {
            grouped.set(service.serviceId, {
                ...service,
                assignments: [...(service.assignments || [])],
                occurrenceCount: 1,
            });
            continue;
        }

        existing.occurrenceCount = (existing.occurrenceCount || 1) + 1;
        existing.assignments = [
            ...(existing.assignments || []),
            ...(service.assignments || []),
        ];
        existing.isValid = existing.isValid !== false && service.isValid !== false;
        existing.groupIds = Array.from(
            new Set([...(existing.groupIds || []), ...(service.groupIds || [])])
        );
    }

    return Array.from(grouped.values());
}

const sortedServices = computed(() => {
    let services = [...props.event.services].sort((a, b) => {
        const sortA = a.sortKey ?? Number.MAX_SAFE_INTEGER;
        const sortB = b.sortKey ?? Number.MAX_SAFE_INTEGER;
        
        // Primary sort: by sortKey
        if (sortA !== sortB) {
            return sortA - sortB;
        }
        
        // Secondary sort: alphabetically by name
        return a.name.localeCompare(b.name, 'de');
    });
    
    // Filter out assigned services if toggle is OFF (default behavior)
    if (!props.showAssigned) {
        services = services.filter(
            (service) => !service.assignments || service.assignments.length === 0
        );
    }
    
    // Filter by selected services (from service filter)
    if (props.filterServices && props.filterServices.length > 0) {
        services = services.filter(
            (service) => props.filterServices!.includes(service.serviceId)
        );
    }
    
    // Filter by selected categories (from category filter)
    if (props.filterCategories && props.filterCategories.length > 0) {
        services = services.filter((service) => {
            const categoryName = (service as any).categoryName;
            return categoryName && props.filterCategories!.includes(categoryName);
        });
    }
    
    return groupDuplicateServices(services);
});

function getUserResponseForService(serviceId: number): ServicePollEntry | undefined {
    return props.userResponses.find(
        (r) => r.eventId === props.event.id && r.serviceId === serviceId
    );
}

function getOtherResponsesForService(serviceId: number): ServicePollEntry[] {
    return props.allResponses.filter(
        (r) =>
            r.eventId === props.event.id &&
            r.serviceId === serviceId &&
            r.userId !== props.currentUser.id
    );
}

function emitSavedResponse(eventId: number, serviceId: number, response: PollResponse) {
    emit('response-saved', {
        eventId,
        serviceId,
        userId: props.currentUser.id,
        userName: props.currentUser.name,
        response,
        comment: '',
        timestamp: new Date().toISOString(),
    });
}

async function saveNoForServices(services: { eventId: number; serviceId: number }[]) {
    try {
        await Promise.all(
            services.map((service) =>
                savePollResponse(service.eventId, service.serviceId, 'no', '')
            )
        );

        for (const service of services) {
            emitSavedResponse(service.eventId, service.serviceId, 'no');
        }

        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: `${services.length} Einträge wurden als Nein gespeichert.`,
            life: 2500,
        });
    } catch (e) {
        debugLog('Error saving no responses:', e);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Die Antworten konnten nicht gespeichert werden.',
            life: 3000,
        });
    }
}

async function declineEvent() {
    bulkActionLoading.value = 'event';
    try {
        await saveNoForServices(
            sortedServices.value.map((service) => ({
                eventId: props.event.id,
                serviceId: service.serviceId,
            }))
        );
    } finally {
        bulkActionLoading.value = null;
    }
}

async function declineDay() {
    bulkActionLoading.value = 'day';
    try {
        const servicesForDay = props.allEvents
            .filter((event) => event.startDate.slice(0, 10) === eventDay.value)
            .flatMap((event) =>
                event.services.map((service) => ({
                    eventId: event.id,
                    serviceId: service.serviceId,
                }))
            );
        await saveNoForServices(servicesForDay);
    } finally {
        bulkActionLoading.value = null;
    }
}

async function deleteEvent() {
    if (!window.confirm('Möchten Sie alle Antworten zu diesem Event wirklich löschen?')) return;
    bulkActionLoading.value = 'delete';
    try {
        const deletedCount = await deleteResponsesForEvent(props.event.id);
        emit('responses-deleted', props.event.id, deletedCount);
        toast.add({
            severity: 'success',
            summary: 'Gelöscht',
            detail: `${deletedCount} Antworten wurden gelöscht.`,
            life: 2500,
        });
    } catch (e) {
        debugLog('Error deleting event responses:', e);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Die Antworten konnten nicht gelöscht werden.',
            life: 3000,
        });
    } finally {
        bulkActionLoading.value = null;
    }
}
</script>

<template>
    <Card class="event-card">
        <template #title>
            <div class="event-header">
                <span class="event-date">{{ formattedDate }}</span>
                <span class="event-name">{{ event.name }}</span>
                <span class="event-time">{{ formattedTime }} Uhr</span>
                <Button
                    icon="pi pi-link"
                    class="link-button"
                    severity="secondary"
                    text
                    rounded
                    @click="openEventInChurchTools"
                    v-tooltip="'Diesen Dienst in ChurchTools öffnen'"
                />
                <div class="bulk-actions">
                    <Button
                        label="Event absagen"
                        icon="pi pi-times"
                        severity="danger"
                        outlined
                        size="small"
                        :loading="bulkActionLoading === 'event'"
                        :disabled="sortedServices.length === 0"
                        @click="declineEvent"
                        v-tooltip="'Alle angezeigten Dienste dieses Events mit Nein beantworten'"
                    />
                    <Button
                        label="Ganzen Tag absagen"
                        icon="pi pi-calendar-times"
                        severity="danger"
                        outlined
                        size="small"
                        :loading="bulkActionLoading === 'day'"
                        :disabled="dayServicesCount === 0"
                        @click="declineDay"
                        v-tooltip="'Alle Dienste dieses Tages mit Nein beantworten'"
                    />
                    <Button
                        label="Alle Antworten löschen"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        size="small"
                        :loading="bulkActionLoading === 'delete'"
                        @click="deleteEvent"
                        v-tooltip="'Entfernt alle gespeicherten Antworten zu diesem Event'"
                    />
                </div>
            </div>
        </template>

        <template #content>
            <div v-if="event.resources && event.resources.length > 0" class="event-resources">
                {{ resourceNames }}
            </div>

            <div class="desktop-view">
                <table class="services-table">
                    <thead>
                        <tr>
                            <th>Dienst</th>
                            <th>Meine Antwort</th>
                            <th>Besetzung</th>
                            <th>Andere Antworten</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ServiceRow
                            v-for="service in sortedServices"
                            :key="service.id"
                            :event-id="event.id"
                            :service="service"
                            :user-response="getUserResponseForService(service.serviceId)"
                            :other-responses="getOtherResponsesForService(service.serviceId)"
                            :current-user="currentUser"
                            layout="table"
                            @response-saved="emit('response-saved', $event)"
                        />
                    </tbody>
                </table>
            </div>

            <div class="mobile-view">
                <ServiceRow
                    v-for="service in sortedServices"
                    :key="service.id"
                    :event-id="event.id"
                    :service="service"
                    :user-response="getUserResponseForService(service.serviceId)"
                    :other-responses="getOtherResponsesForService(service.serviceId)"
                    :current-user="currentUser"
                    layout="card"
                    @response-saved="emit('response-saved', $event)"
                />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.event-card {
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
}

.event-date {
    font-weight: 600;
    color: #333;
}

.event-name {
    color: #666;
}

.event-time {
    color: #999;
    font-size: 0.9em;
}

.event-resources {
    color: #999;
    font-size: 0.85em;
    margin-top: 2px;
}

.event-resources.unavailable {
    color: #b08800;
    font-style: italic;
}

.bulk-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: auto; margin-right: 0;
}

.link-button {
    padding: 0.25rem 0.5rem;
    cursor: pointer;
}

.link-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.services-table {
    width: 100%;
    border-collapse: collapse;
}

.services-table th {
    text-align: left;
    padding: 12px 8px;
    border-bottom: 2px solid #ddd;
    color: #666;
    font-weight: 600;
}

.desktop-view {
    display: block;
}

.mobile-view {
    display: none;
}

@media (max-width: 900px) {
    .desktop-view {
        display: none;
    }

    .mobile-view {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}
</style>
