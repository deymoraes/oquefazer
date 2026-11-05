<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import CategoriaItem from './CategoriaItem.vue'
import NovaCategoriaModal from './NovaCategoriaModal.vue'

const store = useAppStore()
const mostrarNovaCategoria = ref(false)

function editarCategoria(categoria: any) {
  // Implementar edição
  console.log('Editar:', categoria)
}
</script>

<template>
  <aside class="menu" @click.stop>
    <div class="menu-header">
      <span class="menu-title">Categorias</span>
      <button class="add-btn" @click="mostrarNovaCategoria = true" aria-label="Nova categoria">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <div class="menu-content">
      <div class="menu-section">
        <CategoriaItem
          v-for="categoria in store.categoriasOrdenadas"
          :key="categoria.id"
          :categoria="categoria"
          :ativa="store.categoriaAtiva === categoria.id && store.viewMode === 'ativas'"
          @click="store.selecionarCategoria(categoria.id)"
          @editar="editarCategoria(categoria)"
        />
      </div>

      <div class="menu-divider"></div>

      <button
        class="menu-item concluidas"
        :class="{ ativo: store.viewMode === 'concluidas' }"
        @click="store.setViewMode('concluidas')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>Concluídas</span>
        <span v-if="store.notasConcluidas.length" class="badge">
          {{ store.notasConcluidas.length }}
        </span>
      </button>
    </div>

    <NovaCategoriaModal
      v-if="mostrarNovaCategoria"
      @fechar="mostrarNovaCategoria = false"
    />
  </aside>
</template>

<style scoped>
.menu {
  width: 260px;
  background: var(--bg-menu);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
  flex-shrink: 0;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--border);
}

.menu-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.add-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-divider {
  height: 1px;
  background: var(--border);
  margin: var(--space-md) 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-align: left;
}

.menu-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.menu-item.ativo {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-item svg {
  flex-shrink: 0;
}

.menu-item span:not(.badge) {
  flex: 1;
}

.badge {
  font-size: 12px;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  color: var(--text-muted);
}

.concluidas svg {
  color: var(--accent-min);
}

@media (max-width: 768px) {
  .menu {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -4px 0 20px var(--shadow);
  }
}
</style>
