<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useNotaStore } from '@/stores/nota'
import Header from '@/components/Header.vue'
import MenuLateral from '@/components/MenuLateral.vue'
import MainContent from '@/components/MainContent.vue'
import NotaModal from '@/components/NotaModal.vue'
import RecallModal from '@/components/RecallModal.vue'
import LoginView from '@/components/LoginView.vue'
import NotificacaoToast from '@/components/NotificacaoToast.vue'

const store = useAppStore()
const notaStore = useNotaStore()

onMounted(async () => {
  if (store.autenticado) {
    await store.inicializar()
  }
})
</script>

<template>
  <LoginView v-if="!store.autenticado" />

  <div v-else class="app">
    <Header @abrir-recall="notaStore.abrirRecall()" />

    <div class="app-body">
      <MainContent />
      <MenuLateral v-if="store.menuAberto" />
    </div>

    <NotaModal v-if="notaStore.modalAberto" />
    <RecallModal v-if="notaStore.recallAberto" />
    <NotificacaoToast />
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
</style>
