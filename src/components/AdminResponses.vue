<script setup lang="ts">
import { ref, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import type { ServicePollEntry, EventWithServices } from '../types';
import { deleteResponse, prepareResponseRows, formatResponse, formatTimestamp } from '../pollService';

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

const emit = defineEmits<{
    (e: 'response-deleted', entry: ServicePollEntry): void;
}>();

const deleteDialogVisible = ref(false);
const selectedResponse = ref<any | null>(null);
const deleting = ref(false);

// Use shared data preparation logic (same as Excel export)
const allRows = computed(() => {
    return prepareResponseRows(props.events, props.responses, false); // includeEmpty = false for table
});

function confirmDelete(row: import('../types').PreparedResponseRow) {
    selectedResponse.value = {
        eventId: row.eventId,
        serviceId: row.serviceId,
        userId: row.userId,
        userName: row.userName,
        response: row.response,
        comment: row.comment,
        timestamp: row.timestamp,
    };
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
        emit('response-deleted', selectedResponse.value);
    } catch (error) {
        console.error('Error deleting response:', error);
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
            :value="allRows" 
            paginator 
            :rows="50" 
            :rowsPerPageOptions="[10, 25, 50, 100]"
            sortMode="multiple"
            removableSort
            stripedRows
            size="small"
            :emptyMessage="'Keine Antworten gefunden.'"
        >
            <Column field="eventName" header="Event" sortable></Column>
            <Column field="weekday" header="Wochentag" sortable></Column>
            <Column field="date" header="Datum" sortable></Column>
            <Column field="time" header="Uhrzeit" sortable></Column>
            <Column field="serviceName" header="Dienst" sortable></Column>
            <Column field="assignment" header="Besetzung" sortable>
                <template #body="slotProps">
                    {{ slotProps.data.assignment || '-' }}
                </template>
            </Column>
            <Column field="userName" header="Benutzer" sortable></Column>
            <Column field="response" header="Antwort" sortable>
                <template #body="slotProps">
                    {{ formatResponse(slotProps.data.response) }}
                </template>
            </Column>
            <Column field="comment" header="Kommentar">
                <template #body="slotProps">
                    {{ slotProps.data.comment || '-' }}
                </template>
            </Column>
            <Column field="timestamp" header="Zeitstempel" sortable>
                <template #body="slotProps">
                    {{ formatTimestamp(slotProps.data.timestamp) }}
                </template>
            </Column>
            <Column header="Aktionen">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-trash" 
                        severity="danger" 
                        text 
                        size="small"
                        @click="confirmDelete(slotProps.data)"
                        title="Antwort löschen"
                    />
                </template>
            </Column>
        </DataTable>

        <Dialog 
            v-model:visible="deleteDialogVisible" 
            modal 
            header="Antwort löschen" 
            :style="{ width: '30rem' }"
        >
            <p>
                Möchten Sie die Antwort von
                <strong>{{ selectedResponse?.userName || `User ${selectedResponse?.userId}` }}</strong>
                wirklich löschen?
            </p>
            <template #footer>
                <Button 
                    label="Abbrechen" 
                    text 
                    @click="deleteDialogVisible = false"
                    :disabled="deleting"
                />
                <Button 
                    label="Löschen" 
                    severity="danger" 
                    @click="handleDelete"
                    :loading="deleting"
                />
            </template>
        </Dialog>
    </div>
</template>
