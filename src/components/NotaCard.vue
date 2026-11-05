<script setup lang="ts">
import type { Nota } from '@/types'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  nota: Nota
  concluida?: boolean
}>()

const store = useAppStore()

function getCorPrioridade(prioridade: string): string {
  switch (prioridade) {
    case 'maxima': return 'var(--accent-max)'
    case 'media': return 'var(--accent-medium)'
    case 'minima': return 'var(--accent-min)'
    default: return 'var(--accent-action)'
  }
}

function formatarData(data: Date): string {
  const d = new Date(data)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  })
}

function formatarHorarioLembrete(data?: Date): string {
  if (!data) return 'Lembrete ativo'
  const d = new Date(data)
  if (isNaN(d.getTime())) return 'Lembrete ativo'
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function toggleConcluir(event: Event) {
  event.stopPropagation()
  if (props.concluida) {
    await store.restaurarNota(props.nota.id)
  } else {
    await store.concluirNota(props.nota.id)
  }
}
</script>

<template>
  <div
    class="nota-card"
    :class="{ concluida }"
    :style="{ '--cor-prioridade': getCorPrioridade(nota.prioridade) }"
  >
    <button
      class="checkbox"
      :class="{ ativo: !concluida }"
      @click="toggleConcluir"
      :aria-label="concluida ? 'Restaurar tarefa' : 'Marcar como concluída'"
    >
      <svg v-if="!concluida" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>

    <div class="nota-content">
      <p class="nota-texto">{{ nota.texto }}</p>
      <div class="nota-meta">
        <span v-if="nota.lembrar?.ativo" class="meta-badge lembrete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ formatarHorarioLembrete(nota.lembrar.dataHora) }}
        </span>
        <span v-if="nota.audioBlob" class="meta-badge audio">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Áudio
        </span>
        <span class="meta-data">{{ formatarData(nota.criadoEm) }}</span>
      </div>
    </div>

    <button class="nota-opcoes" aria-label="Editar tarefa">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.nota-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--cor-prioridade);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nota-card:hover {
  background: var(--bg-tertiary);
}

.nota-card.concluida {
  opacity: 0.6;
  border-left-color: var(--text-muted);
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  margin-top: 2px;
  color: transparent;
}

.checkbox.ativo {
  border-color: var(--accent-min);
}

.checkbox.ativo:hover {
  background: var(--accent-min);
  border-color: var(--accent-min);
  color: var(--bg-primary);
}

.nota-card.concluida .checkbox {
  background: var(--accent-min);
  border-color: var(--accent-min);
  color: var(--bg-primary);
}

.nota-content {
  flex: 1;
  min-width: 0;
}

.nota-texto {
  font-size: 15px;
  line-height: 1.4;
  color: var(--text-primary);
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nota-card.concluida .nota-texto {
  text-decoration: line-through;
  color: var(--text-muted);
}

.nota-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  background: var(--bg-primary);
}

.meta-badge.lembrete {
  color: var(--accent-recall);
}

.meta-badge.audio {
  color: var(--accent-action);
}

.meta-data {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}

.nota-opcoes {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.nota-card:hover .nota-opcoes {
  opacity: 1;
}

.nota-opcoes:hover {
  background: var(--bg-primary);
  color: var(--text-secondary);
}
</style>
