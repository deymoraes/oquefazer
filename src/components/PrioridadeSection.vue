<script setup lang="ts">
import { ref } from 'vue'
import type { Nota, Prioridade } from '@/types'
import NotaCard from './NotaCard.vue'

const _props = defineProps<{
  id: Prioridade
  label: string
  cor: string
  notas: Nota[]
}>()

const emit = defineEmits<{
  notaClick: [id: string]
}>()

const colapsado = ref(false)

function toggleColapsado() {
  colapsado.value = !colapsado.value
}
</script>

<template>
  <section class="prioridade-section" :class="{ colapsada: colapsado }">
    <button class="section-header" @click="toggleColapsado">
      <span class="section-indicator" :style="{ background: cor }"></span>
      <span class="section-label">{{ label }}</span>
      <span class="section-count">{{ notas.length }}</span>
      <svg
        class="chevron"
        :class="{ rotacionado: !colapsado }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div class="section-content" v-show="!colapsado">
      <div v-if="notas.length === 0" class="section-empty">
        Sem tarefas com {{ label.toLowerCase() }}
      </div>

      <TransitionGroup v-else name="nota" tag="div" class="notas-list">
        <NotaCard
          v-for="nota in notas"
          :key="nota.id"
          :nota="nota"
          @click="emit('notaClick', nota.id)"
        />
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
.prioridade-section {
  margin-bottom: var(--space-lg);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) 0;
  margin-bottom: var(--space-md);
  text-align: left;
}

.section-header:hover .section-label {
  color: var(--text-primary);
}

.section-indicator {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

.section-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

.section-count {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.chevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.chevron.rotacionado {
  transform: rotate(180deg);
}

.section-empty {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border);
}

.notas-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Animações */
.nota-enter-active,
.nota-leave-active {
  transition: all 0.2s ease;
}

.nota-enter-from,
.nota-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.nota-move {
  transition: transform 0.3s ease;
}
</style>
