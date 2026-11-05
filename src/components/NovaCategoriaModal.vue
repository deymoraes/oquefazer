<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import type { Categoria } from '@/types'

const props = defineProps<{
  categoria?: Categoria | null
}>()

const emit = defineEmits<{
  fechar: []
}>()

const store = useAppStore()

const nome = ref('')
const corSelecionada = ref('#3B82F6')

const cores = [
  '#EF4444', // vermelho
  '#F59E0B', // amarelo
  '#22C55E', // verde
  '#3B82F6', // azul
  '#8B5CF6', // roxo
  '#EC4899', // rosa
  '#06B6D4', // ciano
  '#F97316'  // laranja
]

onMounted(() => {
  if (props.categoria) {
    nome.value = props.categoria.nome
    corSelecionada.value = props.categoria.cor || '#3B82F6'
  }
})

async function salvar() {
  if (!nome.value.trim()) {
    return
  }

  if (props.categoria) {
    await store.atualizarCategoria(props.categoria.id, {
      nome: nome.value.trim(),
      cor: corSelecionada.value
    })
  } else {
    const nova = await store.criarCategoria(nome.value.trim(), corSelecionada.value)
    store.selecionarCategoria(nova.id)
  }
  emit('fechar')
}

async function excluir() {
  if (!props.categoria || props.categoria.isDefault) return
  if (confirm(`Deseja realmente excluir a categoria "${props.categoria.nome}" e suas tarefas?`)) {
    await store.excluirCategoria(props.categoria.id)
    emit('fechar')
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('fechar')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ categoria ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
        <button class="close-btn" @click="emit('fechar')" aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="input-group">
          <label class="label">Nome da categoria</label>
          <input
            v-model="nome"
            type="text"
            placeholder="Ex: Estudos, Projeto X..."
            maxlength="30"
            autofocus
            @keyup.enter="salvar"
          />
        </div>

        <div class="cores-group">
          <label class="label">Cor</label>
          <div class="cores-grid">
            <button
              v-for="cor in cores"
              :key="cor"
              class="cor-btn"
              :class="{ ativo: corSelecionada === cor }"
              :style="{ background: cor }"
              @click="corSelecionada = cor"
              :aria-label="`Cor ${cor}`"
            >
              <svg v-if="corSelecionada === cor" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="preview">
          <span class="preview-icone" :style="{ background: corSelecionada }"></span>
          <span class="preview-nome">{{ nome || 'Nome da categoria' }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="categoria && !categoria.isDefault"
          class="btn btn-danger"
          @click="excluir"
        >
          Excluir
        </button>
        <div class="footer-right">
          <button class="btn btn-secondary" @click="emit('fechar')">Cancelar</button>
          <button class="btn btn-primary" @click="salvar">
            {{ categoria ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: 1100;
}

.modal {
  width: 100%;
  max-width: 360px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  animation: fadeIn 0.2s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
}

.input-group input {
  width: 100%;
}

.cores-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--space-sm);
}

.cor-btn {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cor-btn:hover {
  transform: scale(1.1);
}

.cor-btn.ativo {
  box-shadow: 0 0 0 2px var(--bg-secondary), 0 0 0 4px currentColor;
}

.preview {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-icone {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.preview-nome {
  font-size: 14px;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.footer-right {
  display: flex;
  gap: var(--space-sm);
  margin-left: auto;
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
}

.btn-primary {
  background: var(--accent-action);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.btn-danger {
  background: transparent;
  color: var(--accent-max);
  padding-left: var(--space-sm);
  padding-right: var(--space-sm);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
