<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import ServiceRow from './ServiceRow.vue';
import { createLogger } from '../utils/logger';
import type {
    EventWithServices,
    ServicePollEntry,
    UserInfo,
} from '../types';

const debugLog = createLogger('EVENT-CARD');

const props = defineProps<{
    event: EventWithServices;
    allResponses: ServicePollEntry[];
    userResponses: ServicePollEntry[];
    currentUser: UserInfo;
    showAssigned: boolean;
    filterServices?: number[];
}>();

const emit = defineEmits<{
    (e: 'response-saved', entry: ServicePollEntry): void;
}>();

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
    
    return services;
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
</script>

<template>
    <Card class="event-card">
        <template #title>
            <div>
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
                </div>
                <div v-if="event.resources && event.resources.length > 0" class="event-resources">
                    {{ resourceNames }}
                </div>
                <div v-else-if="event.resourcesUnavailable" class="event-resources unavailable">
                    <i class="pi pi-lock"></i> Keine Berechtigung, die Räume zu diesem Event zu sehen
                </div>
                </div>
                </template>
                <template #content>
            <!-- Desktop: Table layout -->
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

            <!-- Mobile: Card layout -->
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
