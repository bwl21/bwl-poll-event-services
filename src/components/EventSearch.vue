<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const localValue = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue;
});

function handleInput(value: string) {
  localValue.value = value;
  emit('update:modelValue', value);
}

function clearSearch() {
  handleInput('');
}
</script>

<template>
  <div class="filter-group">
    <div class="search-input-wrapper">
      <InputText
        id="eventSearch"
        :model-value="localValue"
        type="text"
        placeholder="Event suchen..."
        @update:model-value="handleInput"
      />
      <Button
        v-if="localValue"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="clearSearch"
        class="clear-btn"
        aria-label="Suche löschen"
      />
    </div>
  </div>
</template>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-grow: 1;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.p-inputtext) {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem !important;
  padding-right: 32px !important;
}

:deep(.p-inputtext:not(:disabled):focus) {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

:deep(.p-inputtext:not(:disabled):hover) {
  border-color: #80bdff;
}

.clear-btn {
  position: absolute;
  right: 4px;
  color: #999;
  z-index: 1;
}

.clear-btn :deep(.p-button) {
  padding: 0 !important;
  width: 28px;
  height: 28px;
}

.clear-btn :deep(.p-button-icon) {
  font-size: 0.8rem;
}
</style>
