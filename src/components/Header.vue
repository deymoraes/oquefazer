<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const emit = defineEmits<{
  abrirRecall: []
}>()
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button class="menu-btn" @click="store.toggleMenu" aria-label="Abrir menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 class="logo">
        <span class="logo-dot maxima"></span>
        <span class="logo-dot media"></span>
        <span class="logo-dot minima"></span>
        OQueFazer
      </h1>
    </div>

    <div class="header-right">
      <button
        class="recall-btn"
        @click="emit('abrirRecall')"
        aria-label="Modo lembrete rápido"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span class="recall-label">Lembrar</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  height: 60px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.menu-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.logo-dot.maxima {
  background: var(--accent-max);
}

.logo-dot.media {
  background: var(--accent-medium);
}

.logo-dot.minima {
  background: var(--accent-min);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.recall-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--accent-recall);
  border-radius: var(--radius-md);
  color: var(--accent-recall);
  font-weight: 500;
}

.recall-btn:hover {
  background: rgba(168, 85, 247, 0.1);
}

.recall-btn svg {
  flex-shrink: 0;
}

.recall-label {
  font-size: 14px;
}

@media (max-width: 480px) {
  .recall-label {
    display: none;
  }
}
</style>
