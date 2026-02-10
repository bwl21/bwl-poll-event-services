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
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { createLogger } from '../utils/logger';
import type { ServicePollEntry, EventWithServices, PollResponse } from '../types';
import { deleteResponse, prepareResponseRows, formatResponse, formatTimestamp, saveAdminPollResponse, getServiceCandidates, getCurrentUser } from '../pollService';

const debugLog = createLogger('ADMIN-RESPONSES');

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
}>();

const emit = defineEmits<{
    (e: 'response-deleted', entry: ServicePollEntry): void;
    (e: 'response-saved', entry: ServicePollEntry): void;
}>();

const toast = useToast();

const deleteDialogVisible = ref(false);
const selectedResponse = ref<any | null>(null);
const deleting = ref(false);
const showEmptyServices = ref(true);
const globalFilter = ref('');

// Edit/Add dialog
const editDialogVisible = ref(false);
const isEditMode = ref(false);
const editingResponse = ref<Partial<ServicePollEntry> | null>(null);
const saving = ref(false);
const serviceCandidates = ref<Map<number, string>>(new Map());
const currentUser = ref<{ id: number; name: string } | null>(null);

const peopleOptions = computed(() => {
    if (!editingResponse.value?.eventId || !editingResponse.value?.serviceId) {
        return [];
    }

    // Get the service to fetch group members
    const event = props.events.find(e => e.id === editingResponse.value?.eventId);
    if (!event) return [];
    
    const service = event.services.find(s => s.id === editingResponse.value?.serviceId);
    if (!service) return [];
    
    // Use service candidates (people from service groups)
    const options = Array.from(serviceCandidates.value.entries()).map(([id, name]) => ({
        label: name,
        value: id,
    }));
    debugLog('peopleOptions for service', editingResponse.value?.serviceId, ':', options);
    return options;
});

// Use shared data preparation logic (same as Excel export)
const allRows = computed(() => {
    const rows = prepareResponseRows(props.events, props.responses, showEmptyServices.value);
    
    // Apply global filter
    if (!globalFilter.value.trim()) {
        return rows;
    }
    
    const filterLower = globalFilter.value.toLowerCase();
    return rows.filter(row => 
        (row.eventName?.toLowerCase().includes(filterLower)) ||
        (row.weekday?.toLowerCase().includes(filterLower)) ||
        (row.date?.toLowerCase().includes(filterLower)) ||
        (row.time?.toLowerCase().includes(filterLower)) ||
        (row.serviceName?.toLowerCase().includes(filterLower)) ||
        (row.userName?.toLowerCase().includes(filterLower)) ||
        (row.comment?.toLowerCase().includes(filterLower))
    );
});

// Load current user on mount
onMounted(async () => {
    try {
        currentUser.value = await getCurrentUser();
        debugLog('Current user:', currentUser.value);
    } catch (error) {
        console.error('[AdminResponses] Error loading current user:', error);
    }
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
    // Get the current event
    const event = props.events.find(e => e.id === editingResponse.value?.eventId);
    if (!event) return `User ${userId}`;
    
    // Get the current service
    const service = event.services.find(s => s.id === editingResponse.value?.serviceId);
    if (!service?.assignments) return `User ${userId}`;
    
    // Find the person in assignments
    const assignment = service.assignments.find(a => a.personId === userId);
    return assignment?.personName || `User ${userId}`;
}

async function openAddDialog(eventId?: number, serviceId?: number) {
    isEditMode.value = false;
    editingResponse.value = {
        eventId: eventId,
        serviceId: serviceId,
        userId: undefined,
        response: null,
        comment: '',
    };
    
    // Load service candidates (people from service groups)
    if (eventId && serviceId) {
        const event = props.events.find(e => e.id === eventId);
        debugLog('Event:', event);
        const service = event?.services.find(s => s.id === serviceId);
        debugLog('Service:', service);
        debugLog('Service groupIds:', service?.groupIds);
        if (service?.groupIds && service.groupIds.length > 0) {
            try {
                serviceCandidates.value = await getServiceCandidates(service.groupIds);
                debugLog('Loaded service candidates:', Array.from(serviceCandidates.value.entries()));
            } catch (error) {
                console.error('[AdminResponses] Error loading service candidates:', error);
            }
        } else {
            debugLog('No groupIds found for service');
        }
    }
    
    editDialogVisible.value = true;
}

async function openEditDialog(row: any) {
    isEditMode.value = true;
    editingResponse.value = { ...row };
    
    // Load service candidates (people from service groups)
    if (row.eventId && row.serviceId) {
        const event = props.events.find(e => e.id === row.eventId);
        const service = event?.services.find(s => s.id === row.serviceId);
        if (service?.groupIds && service.groupIds.length > 0) {
            try {
                serviceCandidates.value = await getServiceCandidates(service.groupIds);
                debugLog('Loaded service candidates for edit:', Array.from(serviceCandidates.value.entries()));
            } catch (error) {
                console.error('[AdminResponses] Error loading service candidates:', error);
            }
        }
    }
    
    editDialogVisible.value = true;
}

async function saveEditingResponse() {
    debugLog('editingResponse.value:', editingResponse.value);
    
    if (!editingResponse.value?.eventId || !editingResponse.value?.serviceId || !editingResponse.value?.userId) {
        debugLog('Missing required fields');
        return;
    }

    saving.value = true;
    try {
        // Get userName from serviceCandidates
        const userName = serviceCandidates.value.get(editingResponse.value.userId) || `User ${editingResponse.value.userId}`;
        debugLog('Saving with response:', editingResponse.value.response, 'comment:', editingResponse.value.comment, 'userName:', userName);
        
        await saveAdminPollResponse(
            editingResponse.value.eventId,
            editingResponse.value.serviceId,
            editingResponse.value.userId,
            editingResponse.value.response as PollResponse,
            editingResponse.value.comment || '',
            userName,
            currentUser.value?.name
        );

        // Emit event with userName included
        const savedEntry = {
            ...editingResponse.value,
            userName,
        } as ServicePollEntry;
        debugLog('Emitting response-saved:', savedEntry);
        emit('response-saved', savedEntry);
        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: 'Antwort wurde erfolgreich gespeichert',
            life: 3000,
        });
        editDialogVisible.value = false;
    } catch (error) {
        console.error('Error saving response:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Speichern',
            detail: error instanceof Error ? error.message : 'Antwort konnte nicht gespeichert werden',
            life: 5000,
        });
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
            summary: 'Fehler beim Löschen',
            detail: error instanceof Error ? error.message : 'Antwort konnte nicht gelöscht werden',
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
        <div class="controls-container">
             <div class="toggle-container">
                 <label for="showEmpty">Leere Services anzeigen</label>
                 <ToggleSwitch id="showEmpty" v-model="showEmptyServices" />
             </div>
             <div class="search-container">
                 <IconField>
                     <InputIcon class="pi pi-search"></InputIcon>
                     <InputText 
                         v-model="globalFilter" 
                         placeholder="Suchen..."
                         class="search-input"
                     />
                 </IconField>
             </div>
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
            <Column field="serviceName" header="Dienst" sortable>
                <template #body="slotProps">
                    <div>
                        <strong>{{ slotProps.data.serviceName }}</strong>
                        <div v-if="slotProps.data.serviceCategoryName" class="service-category">
                            {{ slotProps.data.serviceCategoryName }}
                        </div>
                    </div>
                </template>
            </Column>
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
            <Column header="Aktionen" style="width: 160px">
                <template #body="slotProps">
                    <Button 
                         icon="pi pi-plus" 
                         severity="success" 
                         text 
                         size="small"
                         @click="openAddDialog(slotProps.data.eventId, slotProps.data.serviceId)"
                         v-tooltip="'Neue Antwort hinzufügen'"
                     />
                     <Button 
                         v-if="slotProps.data.userName && slotProps.data.userName !== '-'"
                         icon="pi pi-pencil" 
                         severity="info" 
                         text 
                         size="small"
                         @click="openEditDialog(slotProps.data)"
                         v-tooltip="'Diese Antwort bearbeiten'"
                     />
                     <Button 
                         v-if="slotProps.data.userName && slotProps.data.userName !== '-'"
                         icon="pi pi-trash" 
                         severity="danger" 
                         text 
                         size="small"
                         @click="confirmDelete(slotProps.data)"
                         v-tooltip="'Diese Antwort löschen'"
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
                     v-tooltip="'Abbrechen ohne zu löschen'"
                 />
                 <Button 
                     label="Löschen" 
                     severity="danger" 
                     @click="handleDelete"
                     :loading="deleting"
                     v-tooltip="'Antwort unwiderruflich löschen'"
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
                    <div v-if="isEditMode" class="user-display">
                        {{ editingResponse.userName || `User ${editingResponse.userId}` }}
                    </div>
                    <Dropdown
                        v-else
                        v-model="editingResponse.userId"
                        :options="peopleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Person wählen"
                        showClear
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
                     v-tooltip="'Änderungen verwerfen und Dialog schließen'"
                 />
                 <Button 
                     label="Speichern" 
                     severity="success" 
                     @click="saveEditingResponse"
                     :loading="saving"
                     v-tooltip="'Antwort speichern'"
                 />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.admin-responses {
    width: 100%;
}

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

.search-container {
    margin-left: auto;
    flex: 1;
    max-width: 300px;
}

.search-input {
    width: 100%;
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
    width: 100% !important;
}

.form-group :deep(.p-dropdown-trigger) {
    width: auto;
}

.user-display {
    padding: 8px 12px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
}

.user-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.user-input-group :deep(.p-dropdown) {
    width: 100%;
}

.user-input-group :deep(.p-inputtext) {
    width: 100%;
}

.help-text {
    font-size: 0.75rem;
    color: #666;
    font-style: italic;
}

.service-category {
    font-size: 0.75rem;
    font-weight: normal;
}
</style>
