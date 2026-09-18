<script setup lang="ts">
/**
 * An on/off field that lines up with the inputs beside it.
 *
 * Every page styled its own checkbox, and each one inherited the
 * `.form-group input { width: 100% }` rule meant for text boxes: the box
 * stretched across the whole column and pushed its own wording onto the next
 * line. The control lives in this component instead, where a parent's scoped
 * styles cannot reach it, and it reads as a switch rather than a tick.
 */
defineProps<{
  /** Field name, shown above the switch like any other field label. */
  label: string
  /** What turning it on means, in the user's words. */
  description?: string
  modelValue: boolean
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <div class="toggle-field">
    <span class="toggle-field-label">{{ label }}</span>
    <label class="toggle-field-control" :class="{ disabled }">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb" /></span>
      <span v-if="description" class="toggle-text">{{ description }}</span>
    </label>
  </div>
</template>

<style scoped>
.toggle-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-field-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

/* Same height and shape as a text field, so a row of fields lines up. */
.toggle-field-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #fbfcff;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
}

.toggle-field-control.disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.toggle-field-control input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  position: relative;
  flex: none;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.2s ease;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  transition: transform 0.2s ease;
}

.toggle-field-control input:checked + .toggle-track {
  background: var(--brand-600);
}

.toggle-field-control input:checked + .toggle-track .toggle-thumb {
  transform: translateX(18px);
}

.toggle-field-control input:focus-visible + .toggle-track {
  outline: 2px solid var(--brand-400);
  outline-offset: 2px;
}

.toggle-text {
  line-height: 1.35;
}

/* No dark-mode rules on purpose. This app's dark mode (a class the layout
   sets, not the system setting) darkens the sidebar and topbar only: the page
   cards, dialogs and their inputs stay light. A dark switch among light text
   fields would be the odd one out. */
</style>
