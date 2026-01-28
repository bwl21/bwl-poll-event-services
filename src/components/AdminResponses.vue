<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ToggleSwitch from 'primevue/toggleswitch';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import type { ServicePollEntry, EventWithServices, PollResponse } from '../types';
import { deleteResponse, prepareResponseRows, formatResponse, formatTimestamp, getAllAssignedPeople, saveAdminPollResponse } from '../pollService';

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

const emit = defineEmits<{
    (e: 'response-deleted', entry: ServicePollEntry): void;
    (e: 'response-saved', entry: ServicePollEntry): void;
}>();

const deleteDialogVisible = ref(false);
const selectedResponse = ref<any | null>(null);
const deleting = ref(false);
const showEmptyServices = ref(true);

// Edit/Add dialog
const editDialogVisible = ref(false);
const isEditMode = ref(false);
const editingResponse = ref<Partial<ServicePollEntry> | null>(null);
const saving = ref(false);
const assignedPeople = ref<Map<number, string>>(new Map());
const peopleOptions = computed(() => {
    return Array.from(assignedPeople.value.entries()).map(([id, name]) => ({
        label: name,
        value: id,
    }));
});

// Use shared data preparation logic (same as Excel export)
const allRows = computed(() => {
    return prepareResponseRows(props.events, props.responses, showEmptyServices.value);
});

// Load assigned people on mount
onMounted(async () => {
    const people = await getAllAssignedPeople(props.events);
    assignedPeople.value = people;
});

// Helper function to get response icon and severity for tags
function getResponseDisplay(response: PollResponse | null) {
    if (!response) {
        return { icon: '', severity: 'secondary', label: '-' };
    }
    
    const displayMap = {
        yes: { icon: 'pi pi-check', severity: 'success', label: 'Ja' },
        maybe: { icon: 'pi pi-question', severity: 'warning', label: 'Vielleicht' },
        no: { icon: 'pi pi-times', severity: 'danger', label: 'Nein' }
    };
    
    return displayMap[response] || { icon: '', severity: 'secondary', label: response };
}

// Get user name from ID
function getUserName(userId: number): string {
    return assignedPeople.value.get(userId) || `User ${userId}`;
}

function openAddDialog() {
    isEditMode.value = false;
    editingResponse.value = {
        eventId: undefined,
        serviceId: undefined,
        userId: undefined,
        response: null,
        comment: '',
    };
    editDialogVisible.value = true;
}

function openEditDialog(row: any) {
    isEditMode.value = true;
    editingResponse.value = { ...row };
    editDialogVisible.value = true;
}

async function saveEditingResponse() {
    if (!editingResponse.value?.eventId || !editingResponse.value?.serviceId || !editingResponse.value?.userId) {
        return;
    }

    saving.value = true;
    try {
        await saveAdminPollResponse(
            editingResponse.value.eventId,
            editingResponse.value.serviceId,
            editingResponse.value.userId,
            editingResponse.value.response as PollResponse,
            editingResponse.value.comment || ''
        );

        // Emit event to trigger parent update
        emit('response-saved', editingResponse.value as ServicePollEntry);
        editDialogVisible.value = false;
    } catch (error) {
        console.error('Error saving response:', error);
    } finally {
        saving.value = false;
    }
}

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
        <div class="controls-container">
            <div class="toggle-container">
                <label for="showEmpty">Leere Services anzeigen</label>
                <ToggleSwitch id="showEmpty" v-model="showEmptyServices" />
            </div>
            <Button 
                label="+ Antwort hinzufügen" 
                icon="pi pi-plus" 
                @click="openAddDialog"
                severity="success"
            />
        </div>
        
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
                    <Tag 
                        :value="getResponseDisplay(slotProps.data.response).label" 
                        :severity="getResponseDisplay(slotProps.data.response).severity"
                        :icon="getResponseDisplay(slotProps.data.response).icon || undefined"
                    />
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
                        icon="pi pi-pencil" 
                        severity="info" 
                        text 
                        size="small"
                        @click="openEditDialog(slotProps.data)"
                        title="Antwort bearbeiten"
                    />
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

        <Dialog 
            v-model:visible="editDialogVisible" 
            modal 
            :header="isEditMode ? 'Antwort bearbeiten' : 'Antwort hinzufügen'" 
            :style="{ width: '40rem' }"
        >
            <div v-if="editingResponse" class="edit-form">
                <div class="form-group">
                    <label for="edit-user">Benutzer</label>
                    <Dropdown
                        id="edit-user"
                        v-model="editingResponse.userId"
                        :options="peopleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Benutzer auswählen"
                        :disabled="isEditMode"
                    />
                </div>

                <div class="form-group">
                    <label for="edit-event">Event-ID</label>
                    <InputText
                        id="edit-event"
                        v-model.number="editingResponse.eventId"
                        type="number"
                        placeholder="Event-ID"
                        :disabled="isEditMode"
                    />
                </div>

                <div class="form-group">
                    <label for="edit-service">Service-ID</label>
                    <InputText
                        id="edit-service"
                        v-model.number="editingResponse.serviceId"
                        type="number"
                        placeholder="Service-ID"
                        :disabled="isEditMode"
                    />
                </div>

                <div class="form-group">
                    <label for="edit-response">Antwort</label>
                    <Dropdown
                        id="edit-response"
                        v-model="editingResponse.response"
                        :options="[
                            { label: 'Ja', value: 'yes' },
                            { label: 'Vielleicht', value: 'maybe' },
                            { label: 'Nein', value: 'no' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Antwort wählen"
                    />
                </div>

                <div class="form-group">
                    <label for="edit-comment">Kommentar</label>
                    <Textarea
                        id="edit-comment"
                        v-model="editingResponse.comment"
                        placeholder="Kommentar (optional)"
                        rows="3"
                    />
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Abbrechen" 
                    text 
                    @click="editDialogVisible = false"
                    :disabled="saving"
                />
                <Button 
                    label="Speichern" 
                    severity="success" 
                    @click="saveEditingResponse"
                    :loading="saving"
                />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.controls-container {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 4px;
}

.toggle-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toggle-container label {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-group label {
    font-size: 0.875rem;
    color: #333;
    font-weight: 500;
}

.form-group :deep(.p-inputtext),
.form-group :deep(.p-dropdown),
.form-group :deep(.p-inputtextarea) {
    width: 100%;
}
</style>
