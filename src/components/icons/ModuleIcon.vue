<script setup lang="ts">
import { computed } from 'vue'
import { getModuleIcon } from './moduleIcons'

/**
 * A module's icon on a tile of its accent colour, as on the Android
 * dashboard: the glyph in white on a gradient of the module colour, or the
 * glyph in colour on a pale tint when `variant="soft"`.
 */
const props = withDefaults(
  defineProps<{
    module: string
    size?: number
    variant?: 'solid' | 'soft'
  }>(),
  { size: 32, variant: 'solid' },
)

const icon = computed(() => getModuleIcon(props.module))

const lineCap = (cap?: string): 'round' | 'butt' | 'square' =>
  cap === 'butt' || cap === 'square' ? cap : 'round'
const glyph = computed(() => Math.round(props.size * 0.58))

const tileStyle = computed(() => {
  const color = icon.value.color
  return props.variant === 'solid'
    ? {
        width: `${props.size}px`,
        height: `${props.size}px`,
        background: `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`,
        color: '#ffffff',
        boxShadow: `0 4px 10px ${color}40`,
      }
    : {
        width: `${props.size}px`,
        height: `${props.size}px`,
        background: `${color}1f`,
        color,
      }
})
</script>

<template>
  <span class="module-icon" :style="tileStyle" aria-hidden="true">
    <svg :width="glyph" :height="glyph" viewBox="0 0 24 24">
      <path
        v-for="(shape, index) in icon.shapes"
        :key="index"
        :d="shape.d"
        :fill="shape.stroke ? 'none' : 'currentColor'"
        :fill-rule="shape.evenOdd ? 'evenodd' : undefined"
        :stroke="shape.stroke ? 'currentColor' : undefined"
        :stroke-width="shape.stroke"
        :stroke-linecap="shape.stroke ? lineCap(shape.cap) : undefined"
        :stroke-linejoin="shape.stroke ? 'round' : undefined"
      />
    </svg>
  </span>
</template>

<style scoped>
.module-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  transition: transform 0.2s ease;
}
</style>
