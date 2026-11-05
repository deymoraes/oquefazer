<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useNotaStore } from '@/stores/nota'
import type { Prioridade, Lembrete } from '@/types'

const store = useAppStore()
const notaStore = useNotaStore()

const texto = ref('')
const prioridade = ref<Prioridade>('media')
const categoriaId = ref<string>(store.categoriaAtiva || store.categoriasOrdenadas[0]?.id || '')
const gravandoAudio = ref(false)
const transcription = ref('')
const mostraLembrete = ref(false)
const tipoLembrete = ref<'rapido' | 'unico' | 'recorrente'>('rapido')
const minutosLembrete = ref(10)
const dataHoraLembrete = ref('')
const recorrenciaTipo = ref<'diario' | 'semanal'>('diario')
const salvando = ref(false)

const recognition = ref<SpeechRecognition | null>(null)

function formatarParaInputDatetimeLocal(data: Date): string {
  const d = new Date(data)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  categoriaId.value = store.categoriaAtiva || store.categoriasOrdenadas[0]?.id || ''

  if (notaStore.notaEditando) {
    const nota = store.notas.find(n => n.id === notaStore.notaEditando)
    if (nota) {
      texto.value = nota.texto
      prioridade.value = nota.prioridade
      categoriaId.value = nota.categoriaId
      if (nota.lembrar?.ativo) {
        mostraLembrete.value = true
        dataHoraLembrete.value = formatarParaInputDatetimeLocal(nota.lembrar.dataHora)
        if (nota.lembrar.tipo === 'recorrente') {
          tipoLembrete.value = 'recorrente'
          if (nota.lembrar.recorrencia?.tipo === 'semanal') {
            recorrenciaTipo.value = 'semanal'
          } else {
            recorrenciaTipo.value = 'diario'
          }
        } else {
          tipoLembrete.value = 'unico'
        }
      }
    }
  }

  // Inicializar reconhecimento de voz
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition.value = new SpeechRecognitionCtor()
    recognition.value.lang = 'pt-BR'
    recognition.value.continuous = true
    recognition.value.interimResults = true

    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcription.value += event.results[i][0].transcript + ' '
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      texto.value = transcription.value + interimTranscript
    }

    recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      gravandoAudio.value = false
    }

    recognition.value.onend = () => {
      gravandoAudio.value = false
    }
  }
})

const notaEditando = computed(() => {
  if (!notaStore.notaEditando) return null
  return store.notas.find(n => n.id === notaStore.notaEditando)
})

async function toggleLembrete() {
  mostraLembrete.value = !mostraLembrete.value
  if (mostraLembrete.value && 'Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {
      // Ignorar caso o navegador bloqueie
    }
  }
}

function iniciarGravacao() {
  if (!recognition.value) {
    alert('Seu navegador não suporta reconhecimento de voz')
    return
  }

  recognition.value.start()
  gravandoAudio.value = true
  transcription.value = texto.value ? texto.value + ' ' : ''
}

function pararGravacao() {
  if (recognition.value) {
    recognition.value.stop()
    gravandoAudio.value = false
  }
}

async function salvar() {
  if (!texto.value.trim()) {
    alert('Digite o texto da tarefa')
    return
  }

  salvando.value = true
  try {
    if (notaStore.notaEditando) {
      const id = notaStore.notaEditando
      await store.atualizarNota(id, {
        texto: texto.value,
        prioridade: prioridade.value,
        categoriaId: categoriaId.value
      })

      if (mostraLembrete.value) {
        await configurarLembrete(id)
      } else if (notaEditando.value?.lembrar) {
        await store.removerLembrete(id)
      }
    } else {
      const catEscolhida = categoriaId.value || store.categoriaAtiva || store.categoriasOrdenadas[0]?.id || ''
      if (catEscolhida && catEscolhida !== store.categoriaAtiva) {
        store.selecionarCategoria(catEscolhida)
      }
      const nota = await store.criarNota(texto.value, prioridade.value, catEscolhida)

      if (mostraLembrete.value) {
        await configurarLembrete(nota.id)
      }
    }

    notaStore.fecharModal()
  } catch (err: any) {
    console.error('Erro ao salvar tarefa:', err)
    const detalhe = err?.message || err?.error_description || 'Erro ao salvar tarefa na nuvem. Verifique sua conexão.'
    alert(detalhe)
  } finally {
    salvando.value = false
  }
}

async function configurarLembrete(notaId: string) {
  let dataHora: Date

  if (tipoLembrete.value === 'rapido') {
    dataHora = new Date(Date.now() + minutosLembrete.value * 60 * 1000)
  } else if (dataHoraLembrete.value) {
    dataHora = new Date(dataHoraLembrete.value)
    if (isNaN(dataHora.getTime())) {
      dataHora = new Date(Date.now() + minutosLembrete.value * 60 * 1000)
    }
  } else {
    dataHora = new Date(Date.now() + minutosLembrete.value * 60 * 1000)
  }

  const lembrete: Omit<Lembrete, 'id' | 'notaId'> = {
    tipo: tipoLembrete.value === 'recorrente' ? 'recorrente' : 'unico',
    dataHora,
    ativo: true,
    recorrencia: tipoLembrete.value === 'recorrente' ? {
      tipo: recorrenciaTipo.value
    } : undefined
  }

  await store.definirLembrete(notaId, lembrete)
}

async function excluir() {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    await store.excluirNota(notaStore.notaEditando!)
    notaStore.fecharModal()
  }
}

function fechar() {
  if (gravandoAudio.value) {
    pararGravacao()
  }
  notaStore.fecharModal()
}
</script>

<template>
  <div class="modal-overlay" @click.self="fechar">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ notaEditando ? 'Editar Tarefa' : 'Nova Tarefa' }}</h2>
        <button class="close-btn" @click="fechar" aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Campo de texto -->
        <div class="input-group">
          <textarea
            v-model="texto"
            placeholder="O que você precisa fazer?"
            rows="3"
            autofocus
          ></textarea>

          <button
            type="button"
            class="record-btn"
            :class="{ ativo: gravandoAudio }"
            @click="gravandoAudio ? pararGravacao() : iniciarGravacao()"
            :aria-label="gravandoAudio ? 'Parar gravação' : 'Iniciar gravação de voz'"
          >
            <svg v-if="!gravandoAudio" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span v-if="gravandoAudio" class="gravando-indicator"></span>
            <span class="record-label">{{ gravandoAudio ? 'Parar' : 'Gravar voz' }}</span>
          </button>
        </div>

        <!-- Categoria -->
        <div v-if="store.categoriasOrdenadas.length > 1" class="categoria-group">
          <label class="label">Categoria</label>
          <div class="categoria-opcoes">
            <button
              v-for="cat in store.categoriasOrdenadas"
              :key="cat.id"
              type="button"
              class="categoria-pill"
              :class="{ ativo: categoriaId === cat.id }"
              @click="categoriaId = cat.id"
            >
              <span class="cat-dot" :style="{ background: cat.cor || 'var(--accent-action)' }"></span>
              {{ cat.nome }}
            </button>
          </div>
        </div>

        <!-- Prioridade -->
        <div class="prioridade-group">
          <label class="label">Prioridade</label>
          <div class="prioridade-opcoes">
            <button
              v-for="p in (['maxima', 'media', 'minima'] as const)"
              :key="p"
              type="button"
              class="prioridade-btn"
              :class="{ ativo: prioridade === p }"
              @click="prioridade = p"
            >
              <span
                class="prioridade-dot"
                :style="{
                  background: p === 'maxima' ? 'var(--accent-max)' :
                             p === 'media' ? 'var(--accent-medium)' :
                             'var(--accent-min)'
                }"
              ></span>
              {{ p === 'maxima' ? 'Máxima' : p === 'media' ? 'Média' : 'Mínima' }}
            </button>
          </div>
        </div>

        <!-- Lembrete -->
        <div class="lembrete-group">
          <button
            type="button"
            class="lembrete-toggle"
            :class="{ ativo: mostraLembrete }"
            @click="toggleLembrete"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Lembrar-me</span>
            <svg
              class="chevron"
              :class="{ rotacionado: mostraLembrete }"
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

          <div v-if="mostraLembrete" class="lembrete-opcoes">
            <div class="lembrete-rapido">
              <button
                v-for="min in [5, 10, 15, 30, 60]"
                :key="min"
                type="button"
                class="tempo-btn"
                :class="{ ativo: tipoLembrete === 'rapido' && minutosLembrete === min }"
                @click="tipoLembrete = 'rapido'; minutosLembrete = min; dataHoraLembrete = ''"
              >
                {{ min }}min
              </button>
            </div>

            <div class="lembrete-custom">
              <label class="label">Agendar data e hora</label>
              <input
                type="datetime-local"
                v-model="dataHoraLembrete"
                @input="tipoLembrete = tipoLembrete === 'recorrente' ? 'recorrente' : 'unico'"
                class="datetime-input"
              />
            </div>

            <div class="lembrete-recorrencia">
              <button
                type="button"
                class="recorrencia-toggle"
                :class="{ ativo: tipoLembrete === 'recorrente' }"
                @click="tipoLembrete = tipoLembrete === 'recorrente' ? (dataHoraLembrete ? 'unico' : 'rapido') : 'recorrente'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Recorrente
              </button>

              <div v-if="tipoLembrete === 'recorrente'" class="recorrencia-opcoes">
                <button
                  type="button"
                  class="recorrencia-btn"
                  :class="{ ativo: recorrenciaTipo === 'diario' }"
                  @click="recorrenciaTipo = 'diario'"
                >
                  Diário
                </button>
                <button
                  type="button"
                  class="recorrencia-btn"
                  :class="{ ativo: recorrenciaTipo === 'semanal' }"
                  @click="recorrenciaTipo = 'semanal'"
                >
                  Semanal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="notaEditando" type="button" class="btn btn-danger" @click="excluir">
          Excluir
        </button>
        <div class="footer-right">
          <button type="button" class="btn btn-secondary" @click="fechar">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="salvando" @click="salvar">
            {{ salvando ? 'Salvando...' : (notaEditando ? 'Salvar' : 'Criar') }}
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
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.input-group textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
  font-size: 15px;
  line-height: 1.5;
}

.record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
}

.record-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.record-btn.ativo {
  background: var(--accent-recall);
  color: white;
}

.gravando-indicator {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.record-label {
  font-weight: 500;
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

.categoria-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.categoria-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.categoria-pill:hover {
  background: var(--bg-primary);
}

.categoria-pill.ativo {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border);
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.prioridade-opcoes {
  display: flex;
  gap: var(--space-sm);
}

.prioridade-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.prioridade-btn:hover {
  background: var(--bg-primary);
}

.prioridade-btn.ativo {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border);
}

.prioridade-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.lembrete-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
}

.lembrete-toggle:hover {
  background: var(--bg-primary);
}

.lembrete-toggle.ativo {
  background: var(--bg-primary);
  color: var(--accent-recall);
}

.lembrete-toggle span {
  flex: 1;
  text-align: left;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.rotacionado {
  transform: rotate(180deg);
}

.lembrete-opcoes {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.lembrete-rapido {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.tempo-btn {
  flex: 1;
  min-width: 50px;
  padding: var(--space-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.tempo-btn:hover {
  color: var(--text-primary);
}

.tempo-btn.ativo {
  background: var(--accent-recall);
  color: white;
}

.datetime-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
}

.recorrencia-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
}

.recorrencia-toggle:hover {
  color: var(--text-primary);
}

.recorrencia-toggle.ativo {
  color: var(--accent-recall);
}

.recorrencia-opcoes {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.recorrencia-btn {
  flex: 1;
  padding: var(--space-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
}

.recorrencia-btn:hover {
  color: var(--text-primary);
}

.recorrencia-btn.ativo {
  background: var(--accent-recall);
  color: white;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
  gap: var(--space-md);
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
