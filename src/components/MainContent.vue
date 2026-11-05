<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useNotaStore } from '@/stores/nota'
import PrioridadeSection from './PrioridadeSection.vue'
import NotaCard from './NotaCard.vue'

const store = useAppStore()
const notaStore = useNotaStore()

const prioridades = [
  { id: 'maxima', label: 'Prioridade Máxima', cor: 'var(--accent-max)' },
  { id: 'media', label: 'Prioridade Média', cor: 'var(--accent-medium)' },
  { id: 'minima', label: 'Prioridade Mínima', cor: 'var(--accent-min)' }
] as const
</script>

<template>
  <main class="main-content" @click="store.fecharMenu">
    <div class="content-wrapper">
      <div v-if="store.erroSincronizacao" class="sync-error-banner">
        <span>{{ store.erroSincronizacao }}</span>
        <button class="retry-btn" @click="store.sincronizarAgora()">Tentar novamente</button>
      </div>

      <!-- Notas Ativas -->
      <template v-if="store.viewMode === 'ativas'">
        <div v-if="store.categoriaAtual" class="categoria-header">
          <h2 class="categoria-titulo">{{ store.categoriaAtual.nome }}</h2>
          <span class="categoria-count">
            {{ store.notasAtivas.filter(n => n.categoriaId === store.categoriaAtiva).length }} tarefas
          </span>
        </div>

        <PrioridadeSection
          v-for="prioridade in prioridades"
          :key="prioridade.id"
          :id="prioridade.id"
          :label="prioridade.label"
          :cor="prioridade.cor"
          :notas="store.notasPorPrioridade[prioridade.id]"
          @nota-click="(id) => notaStore.abrirModal(id)"
        />

        <div v-if="store.notasPorPrioridade.maxima.length === 0 &&
                   store.notasPorPrioridade.media.length === 0 &&
                   store.notasPorPrioridade.minima.length === 0"
             class="empty-state"
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h3>Nenhuma tarefa</h3>
          <p>Clique no botão abaixo para criar sua primeira tarefa</p>
        </div>
      </template>

      <!-- Notas Concluídas -->
      <template v-else>
        <div class="concluidas-header">
          <h2 class="concluidas-titulo">Tarefas Concluídas</h2>
          <button
            v-if="store.notasConcluidas.length > 0"
            class="limpar-btn"
            @click="store.limparConcluidas"
          >
            Limpar todas
          </button>
        </div>

        <div v-if="store.notasConcluidas.length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3>Nenhuma tarefa concluída</h3>
          <p>Complete uma tarefa para vê-la aqui</p>
        </div>

        <div v-else class="concluidas-list">
          <NotaCard
            v-for="nota in store.notasConcluidas"
            :key="nota.id"
            :nota="nota"
            :concluida="true"
            @click="notaStore.abrirModal(nota.id)"
          />
        </div>
      </template>
    </div>

    <!-- Botão flutuante para adicionar nota -->
    <button
      v-if="store.viewMode === 'ativas'"
      class="fab"
      @click="notaStore.abrirModal()"
      aria-label="Nova tarefa"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>Nova Tarefa</span>
    </button>
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  padding-bottom: 100px;
  position: relative;
}

.content-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.sync-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: var(--radius-md);
  color: var(--accent-max);
  font-size: 13px;
}

.retry-btn {
  padding: 4px 10px;
  background: var(--accent-max);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.categoria-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.categoria-titulo {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.categoria-count {
  font-size: 14px;
  color: var(--text-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  font-size: 14px;
}

.concluidas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.concluidas-titulo {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.limpar-btn {
  font-size: 13px;
  color: var(--text-muted);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
}

.limpar-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.concluidas-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.fab {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--accent-action);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5);
}

@media (max-width: 768px) {
  .main-content {
    padding: var(--space-md);
    padding-bottom: 120px;
  }

  .fab {
    bottom: var(--space-md);
    right: var(--space-md);
    padding: var(--space-md);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    justify-content: center;
  }

  .fab span {
    display: none;
  }

  .fab svg {
    width: 24px;
    height: 24px;
  }
}
</style>
