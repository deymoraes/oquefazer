<script setup lang="ts">
import type { Categoria } from '@/types'

const _props = defineProps<{
  categoria: Categoria
  ativa: boolean
}>()

const emit = defineEmits<{
  editar: []
}>()
</script>

<template>
  <div
    class="categoria-item"
    :class="{ ativa }"
    @click="emit('editar')"
  >
    <span
      class="categoria-icone"
      :style="{ background: categoria.cor || 'var(--accent-action)' }"
    ></span>
    <span class="categoria-nome">{{ categoria.nome }}</span>
    <button class="menu-btn" @click.stop="emit('editar')" aria-label="Opções">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.categoria-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.categoria-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.categoria-item.ativa {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.categoria-icone {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.categoria-nome {
  flex: 1;
  font-size: 14px;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.categoria-item:hover .menu-btn {
  opacity: 1;
}

.menu-btn:hover {
  background: var(--bg-primary);
  color: var(--text-secondary);
}
</style>
