<script setup lang="ts">
import { computed } from 'vue';
import MultiSelect from 'primevue/multiselect';

interface RoomOption {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: string[];
  options: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const roomOptions = computed<RoomOption[]>(() => {
  return props.options.map((name) => ({
    value: name,
    label: name,
  }));
});

function handleUpdate(selected: string[]) {
  emit('update:modelValue', selected);
}
</script>

<template>
  <div class="filter-group">
    <MultiSelect
      id="roomFilter"
      :model-value="modelValue"
      :options="roomOptions"
      option-label="label"
      option-value="value"
      placeholder="Räume"
      :show-toggle-all="false"
      :max-selected-labels="1"
      display="chip"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

:deep(.p-multiselect) {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem !important;
  padding: 6px 8px !important;
  height: 38px;
}

:deep(.p-multiselect .p-multiselect-label) {
  padding: 0;
  line-height: 1.2;
  max-height: 22px;
  overflow: hidden;
}

:deep(.p-multiselect:not(.p-disabled):hover) {
  border-color: #80bdff;
}

:deep(.p-multiselect-trigger) {
  width: auto;
  padding: 0;
  margin-left: 4px;
}

:deep(.p-chip) {
  background-color: #e8f5e9;
  color: #388e3c;
  font-size: 0.65rem;
  padding: 2px 5px;
  margin: 1px;
}

:deep(.p-multiselect .p-placeholder) {
  font-size: 0.85rem;
  padding: 0;
}
</style>
