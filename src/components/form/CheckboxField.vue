<script setup lang="ts">
/**
 * A tick box with its wording beside it, for lists of choices and for
 * acknowledgements ("yes, I understand this deletes data").
 *
 * Like ToggleField, the box itself lives here so that a page's scoped
 * `input { width: 100% }` cannot stretch it across the column.
 */
defineProps<{
  label: string
  modelValue: boolean
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <label class="checkbox-field" :class="{ disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="checkbox-field-text"><slot>{{ label }}</slot></span>
  </label>
</template>

<style scoped>
.checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #334155;
  cursor: pointer;
}

.checkbox-field.disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.checkbox-field input {
  flex: none;
  width: 18px;
  min-width: 18px;
  height: 18px;
  margin: 1px 0 0;
  padding: 0;
  accent-color: var(--brand-600);
  cursor: inherit;
}

/* No dark-mode rules: the app's dark mode covers the sidebar and topbar, not
   the page cards this sits in. */
</style>
