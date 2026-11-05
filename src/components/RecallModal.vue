<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useNotaStore } from '@/stores/nota'

const store = useAppStore()
const notaStore = useNotaStore()

const texto = ref('')
const minutosSelecionados = ref(10)
const gravandoAudio = ref(false)
const transcription = ref('')
const salvando = ref(false)

const recognition = ref<SpeechRecognition | null>(null)

onMounted(async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {
      // Ignorar se bloqueado
    }
  }

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

    recognition.value.onerror = () => {
      gravandoAudio.value = false
    }

    recognition.value.onend = () => {
      gravandoAudio.value = false
    }
  }
})

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

async function criarLembreteRapido() {
  if (!texto.value.trim()) {
    alert('Digite o texto do lembrete')
    return
  }

  salvando.value = true
  try {
    const notaCriada = await store.criarNota(texto.value.trim(), 'media')
    const dataHora = new Date(Date.now() + minutosSelecionados.value * 60 * 1000)

    await store.definirLembrete(notaCriada.id, {
      tipo: 'unico',
      dataHora,
      ativo: true
    })

    notaStore.fecharRecall()
  } catch (err) {
    console.error('Erro ao criar lembrete rápido:', err)
    alert('Não foi possível criar o lembrete. Verifique sua conexão.')
  } finally {
    salvando.value = false
  }
}

function fechar() {
  if (gravandoAudio.value) {
    pararGravacao()
  }
  notaStore.fecharRecall()
}
</script>

<template>
  <div class="modal-overlay" @click.self="fechar">
    <div class="modal">
      <div class="modal-header">
        <div class="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <h2>Lembrete Rápido</h2>
        <button class="close-btn" @click="fechar" aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <textarea
          v-model="texto"
          placeholder="O que você precisa lembrar?"
          rows="2"
          autofocus
        ></textarea>

        <button
          type="button"
          class="record-btn"
          :class="{ ativo: gravandoAudio }"
          @click="gravandoAudio ? pararGravacao() : iniciarGravacao()"
        >
          <svg v-if="!gravandoAudio" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          <span v-if="gravandoAudio" class="gravando-indicator"></span>
          {{ gravandoAudio ? 'Parar' : 'Gravar voz' }}
        </button>

        <div class="tempo-opcoes">
          <button
            v-for="min in [5, 10, 15, 30, 60]"
            :key="min"
            type="button"
            class="tempo-btn"
            :class="{ ativo: minutosSelecionados === min }"
            @click="minutosSelecionados = min"
          >
            {{ min }}min
          </button>
        </div>

        <p class="preview">
          Vou te lembrar em <strong>{{ minutosSelecionados }} minutos</strong>
        </p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="fechar">Cancelar</button>
        <button type="button" class="btn btn-primary" :disabled="salvando" @click="criarLembreteRapido">
          {{ salvando ? 'Salvando...' : 'Criar Lembrete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--accent-recall);
  animation: fadeIn 0.2s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(168, 85, 247, 0.1);
  border-radius: var(--radius-md);
  color: var(--accent-recall);
}

.modal-header h2 {
  flex: 1;
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
  gap: var(--space-md);
}

.modal-body textarea {
  width: 100%;
  min-height: 80px;
  resize: vertical;
  font-size: 15px;
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
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.tempo-opcoes {
  display: flex;
  gap: var(--space-sm);
}

.tempo-btn {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.tempo-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.tempo-btn.ativo {
  background: var(--accent-recall);
  color: white;
}

.preview {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.preview strong {
  color: var(--accent-recall);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
}

.btn-primary {
  background: var(--accent-recall);
  color: white;
}

.btn-primary:hover {
  background: #9333ea;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
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
