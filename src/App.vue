<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import Header from '@/components/Header.vue'
import MenuLateral from '@/components/MenuLateral.vue'
import MainContent from '@/components/MainContent.vue'
import NotaModal from '@/components/NotaModal.vue'
import RecallModal from '@/components/RecallModal.vue'
import { useNotaStore } from '@/stores/nota'

const store = useAppStore()
const notaStore = useNotaStore()

onMounted(async () => {
  await store.inicializar()
  // Registrar service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }
})
</script>

<template>
  <div class="app">
    <Header @abrir-recall="notaStore.abrirRecall()" />

    <div class="app-body">
      <MainContent />
      <MenuLateral v-if="store.menuAberto" />
    </div>

    <NotaModal v-if="notaStore.modalAberto" />
    <RecallModal v-if="notaStore.recallAberto" />
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
