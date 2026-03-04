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
import { useToast } from 'primevue/usetoast';
import { createLogger } from '../utils/logger';
import type { ServicePollEntry, EventWithServices, PollResponse } from '../types';
import { deleteResponse, prepareResponseRows, formatResponse, formatTimestamp, saveAdminPollResponse, getServiceCandidates, getCurrentUser, getCurrentUserGroupIds } from '../pollService';
import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';

const debugLog = createLogger('ADMIN-RESPONSES');

const props = defineProps<{
    responses: ServicePollEntry[];
    events: EventWithServices[];
    serviceMasterData?: any;
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
const showOnlyMyServices = ref(false);
const userGroupIds = ref<number[]>([]);
const filterCategories = ref<string[]>([]);
const filterRooms = ref<string[]>([]);
const resultCount = computed(() => allRows.value.length);
const activeFiltersCount = computed(() => {
  let count = 0;
  if (globalFilter.value.trim().length > 0) count++;
  if (filterCategories.value.length > 0) count++;
  if (filterRooms.value.length > 0) count++;
  if (showEmptyServices.value === false) count++;
  if (showOnlyMyServices.value === true) count++;
  return count;
});

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

// Available categories for filter dropdown
const availableCategories = computed(() => {
    const categories = new Set<string>();
    for (const event of props.events) {
        for (const service of event.services) {
            if ((service as any).categoryName) {
                categories.add((service as any).categoryName);
            }
        }
    }
    return Array.from(categories).sort();
});

// Available rooms for filter dropdown
const availableRooms = computed(() => {
    const rooms = new Set<string>();
    for (const event of props.events) {
        if (event.resources && Array.isArray(event.resources)) {
            for (const resource of event.resources) {
                if (resource.name) rooms.add(resource.name);
            }
        }
    }
    return Array.from(rooms).sort();
});

// Use shared data preparation logic (same as Excel export)
const allRows = computed(() => {
    let rows = prepareResponseRows(props.events, props.responses, showEmptyServices.value);
    
    // Filter to only services user can plan (if toggle is ON)
    if (showOnlyMyServices.value && userGroupIds.value.length > 0 && props.serviceMasterData?.services) {
        debugLog('=== SERVICE FILTER START ===');
        debugLog('User groups:', userGroupIds.value);
        debugLog('Master data services count:', props.serviceMasterData.services.length);
        debugLog('Sample service from master data:', props.serviceMasterData.services[0]);
        debugLog('Rows before filter:', rows.length);
        
        rows = rows.filter(row => {
            // Find the service definition in master data
            const serviceDef = props.serviceMasterData.services.find((s: any) => s.id === row.serviceId);
            
            if (!serviceDef) {
                debugLog('❌ Service NOT found. Looking for ID:', row.serviceId, 'in master data IDs:', props.serviceMasterData.services.map((s: any) => s.id));
                return false;
            }
            
            debugLog(`✓ Service found: "${row.serviceName}" (ID: ${row.serviceId})`);
            debugLog('  groupIds:', serviceDef.groupIds, 'onlyAssignFromGroups:', serviceDef.onlyAssignFromGroups);
            
            // Check if service's groupIds overlap with user's groupIds
            const serviceGroupIds = serviceDef.groupIds || [];
            if (serviceGroupIds.length === 0 && !serviceDef.onlyAssignFromGroups) {
                // Service has no group restriction
                debugLog('  → NO group restriction, INCLUDE');
                return true;
            }
            
            // Service has group restriction - check if user is in one of the groups
            const userCanPlan = serviceGroupIds.some((gid: number) => userGroupIds.value.includes(gid));
            debugLog(`  → Groups match? ${userCanPlan ? '✓ YES' : '❌ NO'}`);
            return userCanPlan;
        });
        debugLog('Rows after filter:', rows.length);
        debugLog('=== SERVICE FILTER END ===');
    } else {
        debugLog('Filter skipped. showOnlyMyServices:', showOnlyMyServices.value, 'userGroupIds:', userGroupIds.value, 'hasServiceMasterData:', !!props.serviceMasterData?.services);
    }
    
    // Filter by service categories (if selected)
    if (filterCategories.value.length > 0) {
        rows = rows.filter(row => filterCategories.value.includes(row.serviceCategoryName || ''));
    }
    
    // Filter by rooms (if selected)
    if (filterRooms.value.length > 0) {
        rows = rows.filter(row => {
            if (!row.rooms) return false;
            // Check if any of the selected rooms is in the row's rooms
            return filterRooms.value.some(room => row.rooms?.includes(room));
        });
    }
    
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
        (row.rooms?.toLowerCase().includes(filterLower)) ||
        (row.userName?.toLowerCase().includes(filterLower)) ||
        (row.comment?.toLowerCase().includes(filterLower))
    );
});

// Load current user and their groups on mount
onMounted(async () => {
    try {
        currentUser.value = await getCurrentUser();
        userGroupIds.value = await getCurrentUserGroupIds();
        debugLog('Current user:', currentUser.value, 'Groups:', userGroupIds.value);
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
        maybe: { icon: 'pi pi-question', severity: 'info', label: 'Vielleicht', color: '#ff9800' },
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

function resetFilters() {
    globalFilter.value = '';
    filterCategories.value = [];
    filterRooms.value = [];
    showEmptyServices.value = true;
    showOnlyMyServices.value = false;
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
        <!-- Filter Bar (Row 1: Controls) -->
        <div class="filter-bar-admin">
            <div class="filter-row">
                <!-- Empty Services Toggle -->
                <div class="control-item toggle-item" v-tooltip="'Dienste ohne Antworten anzeigen'">
                    <label for="showEmpty" class="control-label">Leer</label>
                    <ToggleSwitch id="showEmpty" v-model="showEmptyServices" />
                </div>
                
                <!-- My Services Toggle -->
                <div class="control-item toggle-item" v-tooltip="'Nur Dienste die ich planen kann'">
                    <label for="showMyServices" class="control-label">Meine</label>
                    <ToggleSwitch id="showMyServices" v-model="showOnlyMyServices" />
                </div>

                <!-- Category Filter -->
                <div class="filter-item-wrapper" v-tooltip="filterCategories.length > 0 ? `Kategorien: ${filterCategories.join(', ')}` : 'Nach Kategorie filtern'">
                    <label class="filter-label-small">Kategorien</label>
                    <MultiSelect 
                        v-model="filterCategories"
                        :options="availableCategories"
                        placeholder="Alle"
                        :show-toggle-all="true"
                        :max-selected-labels="1"
                        display="chip"
                        filter
                        filter-placeholder="Kategorien suchen..."
                        class="flex-item"
                    />
                </div>

                <!-- Room Filter -->
                <div class="filter-item-wrapper" v-tooltip="filterRooms.length > 0 ? `Räume: ${filterRooms.join(', ')}` : 'Nach Raum filtern'">
                    <label class="filter-label-small">Räume</label>
                    <MultiSelect 
                        v-model="filterRooms"
                        :options="availableRooms"
                        placeholder="Alle"
                        :show-toggle-all="true"
                        :max-selected-labels="1"
                        display="chip"
                        filter
                        filter-placeholder="Räume suchen..."
                        class="flex-item"
                    />
                </div>
                
                <!-- Search -->
                <div class="filter-item-wrapper search-wrapper" v-tooltip="'Nach Event, Dienst, Person suchen'">
                    <label class="filter-label-small">Suche</label>
                    <InputText 
                        v-model="globalFilter" 
                        placeholder="Event, Dienst, Person..."
                        class="flex-item search-input"
                    />
                </div>
            </div>

            <!-- Filter Bar (Row 2: Summary) -->
            <div class="filter-row row-summary">
                <div class="summary-left">
                    <Button
                        icon="pi pi-copy"
                        label="Kopieren"
                        severity="info"
                        text
                        size="small"
                        @click="() => navigator.clipboard.writeText(window.location.href)"
                        class="copy-btn"
                        v-tooltip="'Aktuelle URL kopieren'"
                    />
                </div>
                <div class="summary-center">
                    <span v-if="activeFiltersCount > 0" class="badge" v-tooltip="'Aktive Filter'">
                        {{ activeFiltersCount }} Filter
                    </span>
                    <span class="results-count" v-tooltip="'Anzahl der angezeigten Zeilen'">
                        {{ resultCount }} Zeile{{ resultCount !== 1 ? 'n' : '' }}
                    </span>
                </div>
                <div class="summary-right">
                    <Button
                        v-if="activeFiltersCount > 0"
                        icon="pi pi-times"
                        label="Reset"
                        text
                        severity="secondary"
                        @click="resetFilters"
                        size="small"
                        class="reset-btn"
                        v-tooltip="'Alle Filter löschen'"
                    />
                </div>
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
            <Column field="rooms" header="Räume" sortable></Column>
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
                        :style="getResponseDisplay(slotProps.data.response).color ? { backgroundColor: getResponseDisplay(slotProps.data.response).color, color: '#000' } : {}"
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

/* Filter Bar Container */
.filter-bar-admin {
    margin-bottom: 20px;
}

.filter-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    flex-wrap: nowrap;
    overflow-x: auto;
}

/* Control Items (Toggles) */
.control-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: auto;
    flex-shrink: 0;
    align-items: flex-start;
    height: 52px;
    justify-content: space-between;
}

.control-label {
    font-size: 0.7rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    height: 12px;
    display: flex;
    align-items: center;
    padding: 0;
}

.toggle-item :deep(.p-toggleswitch) {
    margin: auto 0;
}

/* Filter Item Wrappers */
.filter-item-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 140px;
}

.search-wrapper {
    flex-grow: 2;
    min-width: 200px;
}

.filter-label-small {
    font-size: 0.7rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 0 2px;
    height: 12px;
    display: flex;
    align-items: center;
}

/* Filter Components */
.flex-item {
    flex-grow: 1;
    width: 100%;
}

.search-input {
    width: 100%;
}

/* Summary Row */
.row-summary {
    gap: 0;
    padding: 8px 12px;
    border-top: 1px solid #e9ecef;
    justify-content: flex-start;
    align-items: center;
}

.summary-left {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
}

.summary-center {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-grow: 1;
    margin-left: 16px;
}

.summary-right {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
}

.badge {
    font-size: 0.7rem;
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.results-count {
    font-size: 0.8rem;
    color: #666;
    font-weight: 500;
    white-space: nowrap;
}

.copy-btn,
.reset-btn {
    flex-shrink: 0;
}

/* PrimeVue component sizing */
:deep(.p-multiselect) {
    width: 100% !important;
    padding: 6px 8px !important;
    font-size: 0.85rem !important;
    height: 38px !important;
    border: 1px solid #ced4da !important;
    border-radius: 4px !important;
}

:deep(.p-multiselect .p-multiselect-label) {
    padding: 0 !important;
    line-height: 1.2 !important;
    max-height: 22px !important;
    overflow: hidden !important;
}

:deep(.p-multiselect:not(.p-disabled):hover) {
    border-color: #80bdff !important;
}

:deep(.p-multiselect-trigger) {
    width: auto !important;
    padding: 0 !important;
    margin-left: 4px !important;
}

:deep(.p-multiselect .p-placeholder) {
    font-size: 0.85rem !important;
    padding: 0 !important;
}

:deep(.p-inputtext) {
    padding: 8px 10px !important;
    font-size: 0.85rem !important;
    height: 38px !important;
}

:deep(.p-toggleswitch) {
    height: 24px !important;
    width: 45px !important;
}

:deep(.p-toggleswitch .p-toggleswitch-slider) {
    height: 24px !important;
}

:deep(.p-button-sm) {
    padding: 6px 8px !important;
    font-size: 0.8rem !important;
    height: 36px !important;
}

:deep(.p-chip) {
    background-color: #e8f5e9;
    color: #388e3c;
    font-size: 0.65rem;
    padding: 2px 5px;
    margin: 1px;
}

/* Mobile */
@media (max-width: 1024px) {
    .filter-row {
        gap: 6px;
        padding: 10px;
    }

    .flex-item {
        min-width: 120px;
    }

    .search-item {
        min-width: 200px;
        flex-grow: 1;
    }
}

@media (max-width: 768px) {
    .filter-row {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        overflow-x: visible;
    }

    .control-item,
    .filter-item-wrapper {
        min-width: unset;
        width: 100%;
    }

    .copy-btn {
        align-self: flex-start;
    }

    .flex-item {
        min-width: unset;
        flex-grow: 0;
        width: 100%;
    }

    .search-input {
        width: 100%;
    }

    :deep(.p-multiselect),
    :deep(.p-inputtext) {
        height: 36px !important;
    }
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
