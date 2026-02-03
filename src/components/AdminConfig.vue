<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ToggleSwitch from 'primevue/toggleswitch';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';
import type { AdminServiceConfig, EventWithServices } from '../types';
import { getServiceConfigs, updateServiceConfig, getAllServicesFromResponses } from '../pollService';

// Debug logging controlled by ?debug URL parameter
const DEBUG = new URLSearchParams(window.location.search).has('debug');

function debugLog(...args: any[]): void {
    if (DEBUG) {
        console.log('[ADMIN-CONFIG DEBUG]', ...args);
    }
}

const props = defineProps<{
    events: EventWithServices[];
}>();

const emit = defineEmits<{
    (e: 'config-changed'): void;
}>();

const toast = useToast();
const loading = ref(true);
const error = ref<string | null>(null);
const configs = ref<(AdminServiceConfig & { categoryName?: string })[]>([]);
const savingServiceIds = ref(new Set<number>()); // Prevent race conditions
const filterText = ref('');

const filteredConfigs = computed(() => {
    if (!filterText.value.trim()) {
        return configs.value;
    }
    
    const query = filterText.value.toLowerCase();
    return configs.value.filter((config) => {
        return (
            (config.serviceName?.toLowerCase().includes(query) ?? false) ||
            (config.categoryName?.toLowerCase().includes(query) ?? false) ||
            config.serviceId.toString().includes(query)
        );
    });
});

async function loadConfigs() {
    loading.value = true;
    error.value = null;
    try {
        // Get all services from masterdata
        const services = await getAllServicesFromResponses();
        const existingConfigs = await getServiceConfigs();

        debugLog('Services from masterdata:', services);
        debugLog('Existing configs:', existingConfigs);

        // Merge: create config entries for all services
        configs.value = services.map((service) => {
            const existingConfig = existingConfigs.find((c) => c.serviceId === service.serviceId);
            return {
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                categoryName: service.categoryName,
                votesVisible: existingConfig?.votesVisible ?? true, // Default to visible
                enabled: existingConfig?.enabled ?? true, // Default to enabled
                id: existingConfig?.id,
            };
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        error.value = errorMsg;
        debugLog('Error loading configs:', err);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Laden',
            detail: `Konfiguration konnte nicht geladen werden: ${errorMsg}`,
            life: 5000,
        });
    } finally {
        loading.value = false;
    }
}

async function handleToggleVotes(config: AdminServiceConfig, newValue: boolean) {
    // Prevent double-toggling (race condition)
    if (savingServiceIds.value.has(config.serviceId)) {
        return;
    }
    
    savingServiceIds.value.add(config.serviceId);
    const previousValue = config.votesVisible;
    
    try {
        config.votesVisible = newValue; // Optimistic update
        await updateServiceConfig(config.serviceId, newValue, config.serviceName, config.enabled);
        debugLog('Updated vote visibility for service', config.serviceId, 'to', newValue);
        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: `Sichtbarkeit für ${config.serviceName || 'Service ' + config.serviceId} geändert`,
            life: 3000,
        });
    } catch (err) {
        config.votesVisible = previousValue; // Revert on error
        const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        debugLog('Error updating config:', err);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Speichern',
            detail: `Änderung konnte nicht gespeichert werden: ${errorMsg}`,
            life: 5000,
        });
    } finally {
        savingServiceIds.value.delete(config.serviceId);
    }
}

async function handleToggleEnabled(config: AdminServiceConfig, newValue: boolean) {
    // Prevent double-toggling (race condition)
    if (savingServiceIds.value.has(config.serviceId)) {
        return;
    }
    
    savingServiceIds.value.add(config.serviceId);
    const previousValue = config.enabled;
    
    try {
        config.enabled = newValue; // Optimistic update
        await updateServiceConfig(config.serviceId, config.votesVisible, config.serviceName, newValue);
        debugLog('Updated enabled status for service', config.serviceId, 'to', newValue);
        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: `Status für ${config.serviceName || 'Service ' + config.serviceId} geändert`,
            life: 3000,
        });
        // Notify parent to reload poll data
        emit('config-changed');
    } catch (err) {
        config.enabled = previousValue; // Revert on error
        const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        debugLog('Error updating config:', err);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Speichern',
            detail: `Änderung konnte nicht gespeichert werden: ${errorMsg}`,
            life: 5000,
        });
    } finally {
        savingServiceIds.value.delete(config.serviceId);
    }
}

onMounted(loadConfigs);
</script>

<template>
    <div class="admin-config">
        <div v-if="loading" class="loading-container">
            <ProgressSpinner />
            <p>Konfiguration wird geladen...</p>
        </div>

        <div v-else-if="error" class="error-state">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ error }}</p>
            <Button
                label="Erneut versuchen"
                icon="pi pi-refresh"
                severity="warning"
                @click="loadConfigs"
            />
        </div>

        <div v-else-if="configs.length === 0" class="empty-state">
            <i class="pi pi-cog"></i>
            <p>Keine Services mit Antworten gefunden.</p>
        </div>

        <div v-else class="filter-section">
            <input
                v-model="filterText"
                type="text"
                placeholder="Service suchen (Name, Kategorie, ID)..."
                class="filter-input"
            />
            <p class="filter-hint">
                💡 <strong>Mehrfach-Sortierung:</strong> Klick auf Spaltenkopf sortiert primär, Shift+Klick fügt weitere Sortierungen hinzu
            </p>
        </div>

        <DataTable
            v-if="!loading && configs.length > 0"
            :value="filteredConfigs"
            stripedRows
            sortMode="multiple"
            removableSort
            class="p-datatable-sm"
        >
            <Column field="serviceId" header="Service ID" sortable style="width: 120px" />
            <Column field="categoryName" header="Kategorie" sortable style="width: 200px">
                <template #body="{ data }">
                    {{ data.categoryName || '-' }}
                </template>
            </Column>
            <Column field="serviceName" header="Service Name" sortable style="min-width: 250px">
                <template #body="{ data }">
                    {{ data.serviceName || `Service ${data.serviceId}` }}
                </template>
            </Column>
            <Column field="enabled" header="Aktiv" sortable style="width: 100px">
                <template #body="{ data }">
                    <div class="toggle-container">
                        <ToggleSwitch
                            :modelValue="data.enabled"
                            @update:modelValue="(val: boolean) => handleToggleEnabled(data, val)"
                            :disabled="savingServiceIds.has(data.serviceId)"
                        />
                        <span v-if="savingServiceIds.has(data.serviceId)" class="saving-indicator">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                    </div>
                </template>
            </Column>
            <Column field="votesVisible" header="Votes sichtbar" sortable style="width: 150px">
                <template #body="{ data }">
                    <div class="toggle-container">
                        <ToggleSwitch
                            :modelValue="data.votesVisible"
                            @update:modelValue="(val: boolean) => handleToggleVotes(data, val)"
                            :disabled="savingServiceIds.has(data.serviceId)"
                        />
                        <span v-if="savingServiceIds.has(data.serviceId)" class="saving-indicator">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.admin-config {
    padding: 16px 0;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #666;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.empty-state i {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.5;
}

.error-state {
    text-align: center;
    padding: 40px 20px;
    color: #dc3545;
}

.error-state i {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.8;
}

.error-state p {
    margin-bottom: 20px;
    color: #666;
}

.filter-section {
    padding: 12px 0 16px 0;
}

.filter-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #495057;
    background: white;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.filter-input:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.filter-input::placeholder {
    color: #999;
}

.filter-hint {
    font-size: 0.8rem;
    color: #666;
    margin-top: 8px;
    margin-bottom: 0;
    font-style: italic;
}

.toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.saving-indicator {
    color: #666;
}
</style>
