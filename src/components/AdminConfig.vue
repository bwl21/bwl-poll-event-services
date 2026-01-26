<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

const toast = useToast();
const loading = ref(true);
const configs = ref<(AdminServiceConfig & { categoryName?: string })[]>([]);
const savingServiceId = ref<number | null>(null);

async function loadConfigs() {
    loading.value = true;
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
                id: existingConfig?.id,
            };
        });
    } catch (error) {
        console.error('Error loading configs:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Konfiguration konnte nicht geladen werden',
            life: 5000,
        });
    } finally {
        loading.value = false;
    }
}

async function handleToggle(config: AdminServiceConfig, newValue: boolean) {
    savingServiceId.value = config.serviceId;
    try {
        await updateServiceConfig(config.serviceId, newValue, config.serviceName);
        config.votesVisible = newValue;
        debugLog('Updated visibility for service', config.serviceId, 'to', newValue);
        toast.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: `Sichtbarkeit für ${config.serviceName || 'Service ' + config.serviceId} geändert`,
            life: 3000,
        });
    } catch (error) {
        console.error('Error updating config:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Änderung konnte nicht gespeichert werden',
            life: 5000,
        });
    } finally {
        savingServiceId.value = null;
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

        <div v-else-if="configs.length === 0" class="empty-state">
            <i class="pi pi-cog"></i>
            <p>Keine Services mit Antworten gefunden.</p>
        </div>

        <DataTable
            v-else
            :value="configs"
            stripedRows
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
            <Column header="Votes sichtbar" style="width: 150px">
                <template #body="{ data }">
                    <div class="toggle-container">
                        <ToggleSwitch
                            :modelValue="data.votesVisible"
                            @update:modelValue="(val: boolean) => handleToggle(data, val)"
                            :disabled="savingServiceId === data.serviceId"
                        />
                        <span v-if="savingServiceId === data.serviceId" class="saving-indicator">
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

.toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.saving-indicator {
    color: #666;
}
</style>
