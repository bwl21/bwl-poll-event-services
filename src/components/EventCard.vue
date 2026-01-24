<script setup lang="ts">
import { computed } from 'vue';
import Card from 'primevue/card';
import ServiceRow from './ServiceRow.vue';
import type {
    EventWithServices,
    ServicePollEntry,
    UserInfo,
} from '../types';

const props = defineProps<{
    event: EventWithServices;
    allResponses: ServicePollEntry[];
    userResponses: ServicePollEntry[];
    currentUser: UserInfo;
}>();

const emit = defineEmits<{
    (e: 'response-saved', entry: ServicePollEntry): void;
}>();

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
            <div class="event-header">
                <span class="event-date">{{ formattedDate }}</span>
                <span class="event-name">{{ event.name }}</span>
                <span class="event-time">{{ formattedTime }} Uhr</span>
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
                            v-for="service in event.services"
                            :key="service.id"
                            :event-id="event.id"
                            :service="service"
                            :user-response="getUserResponseForService(service.id)"
                            :other-responses="getOtherResponsesForService(service.id)"
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
                    v-for="service in event.services"
                    :key="service.id"
                    :event-id="event.id"
                    :service="service"
                    :user-response="getUserResponseForService(service.id)"
                    :other-responses="getOtherResponsesForService(service.id)"
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
