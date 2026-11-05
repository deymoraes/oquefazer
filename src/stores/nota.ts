import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotaStore = defineStore('nota', () => {
  const modalAberto = ref(false)
  const recallAberto = ref(false)
  const notaEditando = ref<string | null>(null)

  function abrirModal(notaId?: string) {
    notaEditando.value = notaId || null
    modalAberto.value = true
  }

  function fecharModal() {
    modalAberto.value = false
    notaEditando.value = null
  }

  function abrirRecall() {
    recallAberto.value = true
  }

  function fecharRecall() {
    recallAberto.value = false
  }

  return {
    modalAberto,
    recallAberto,
    notaEditando,
    abrirModal,
    fecharModal,
    abrirRecall,
    fecharRecall
  }
})
