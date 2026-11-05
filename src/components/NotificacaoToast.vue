<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const store = useAppStore()
</script>

<template>
  <div v-if="store.notificacaoToast" class="toast-wrapper">
    <div class="toast">
      <div class="toast-header">
        <span class="toast-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Lembrete
        </span>
        <button class="toast-close" @click="store.fecharToastNotificacao()" aria-label="Fechar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p class="toast-texto">{{ store.notificacaoToast.texto }}</p>

      <div class="toast-actions">
        <button
          class="toast-btn snooze"
          @click="store.adiarLembrete(store.notificacaoToast.id, 10)"
        >
          Soneca 10min
        </button>
        <button
          class="toast-btn done"
          @click="store.concluirNota(store.notificacaoToast.id)"
        >
          Marcar como feita
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  width: calc(100% - 32px);
  max-width: 420px;
  animation: fadeIn 0.2s ease-out;
}

.toast {
  background: var(--bg-secondary);
  border: 1px solid var(--accent-recall);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: 0 10px 30px var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.toast-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toast-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-recall);
}

.toast-close {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.toast-close:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.toast-texto {
  font-size: 15px;
  color: var(--text-primary);
  word-wrap: break-word;
}

.toast-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.toast-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.toast-btn.snooze {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.toast-btn.snooze:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.toast-btn.done {
  background: var(--accent-min);
  color: #0D0D0D;
  font-weight: 600;
}

.toast-btn.done:hover {
  opacity: 0.9;
}
</style>
