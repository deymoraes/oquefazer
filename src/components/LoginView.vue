<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const erro = ref('')
const entrando = ref(false)

async function handleSubmit() {
  erro.value = ''

  if (!email.value.trim() || !senha.value) {
    erro.value = 'Preencha seu e-mail e senha.'
    return
  }

  entrando.value = true
  try {
    const sucesso = await store.login(email.value, senha.value)
    if (!sucesso) {
      erro.value = 'E-mail ou senha incorretos.'
    }
  } finally {
    entrando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="logo-dot maxima"></span>
          <span class="logo-dot media"></span>
          <span class="logo-dot minima"></span>
          <h1>OQueFazer</h1>
        </div>
        <p class="subtitle">Acesse suas tarefas sincronizadas</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="input-group">
          <label for="email" class="label">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            autocomplete="username"
            autofocus
            required
          />
        </div>

        <div class="input-group">
          <label for="senha" class="label">Senha</label>
          <div class="password-wrapper">
            <input
              id="senha"
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              placeholder="Sua senha"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="mostrarSenha = !mostrarSenha"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
            >
              <svg v-if="!mostrarSenha" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="erro" class="error-msg">{{ erro }}</p>

        <button type="submit" class="btn-entrar" :disabled="entrando">
          {{ entrando ? 'Entrando...' : 'Entrar' }}
        </button>

        <p class="persistent-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Sessão permanente neste dispositivo
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: var(--bg-primary);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg);
  box-shadow: 0 12px 32px var(--shadow);
  animation: fadeIn 0.2s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-xs);
}

.logo h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.logo-dot {
  width: 9px;
  height: 9px;
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

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.input-group input {
  width: 100%;
  padding: 12px var(--space-md);
  font-size: 15px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.toggle-password:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.error-msg {
  font-size: 13px;
  color: var(--accent-max);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-align: center;
}

.btn-entrar {
  margin-top: var(--space-xs);
  width: 100%;
  padding: 12px var(--space-lg);
  background: var(--accent-action);
  color: white;
  font-weight: 600;
  font-size: 15px;
  border-radius: var(--radius-md);
}

.btn-entrar:hover:not(:disabled) {
  background: #2563eb;
}

.persistent-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}
</style>
