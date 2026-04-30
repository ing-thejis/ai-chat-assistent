<script setup lang="ts">
/**
 * @fileoverview Componente raíz de la aplicación Kora.
 *
 * Orquesta el layout principal: pantalla de login o interfaz de chat.
 * Incluye header con branding, toggle de tema y botón de logout.
 *
 * @component App
 */

import { ref, nextTick, watch, computed } from "vue"
import { LogOut, Sun, Moon, Sparkles, MessageSquare } from "@lucide/vue"
import ChatMessage from "./components/ChatMessage.vue"
import ChatInput from "./components/ChatInput.vue"
import LoginView from "./components/LoginView.vue"
import { useChat } from "./composable/useChat"
import { useAuth } from "./composable/useAuth"
import { useTheme } from "./composable/useTheme"

const { messages, isLoading, error, sendMessage, clearChat } = useChat()
const { session, isLoading: authLoading, signOut } = useAuth()
const { current: theme, toggleTheme } = useTheme()

/** Referencia al centinela para auto-scroll al final del chat. */
const chatEnd = ref<HTMLElement | null>(null)

/** Icono del toggle de tema según el tema activo. */
const themeIcon = computed(() => (theme.value === "dark" ? Sun : Moon))
const themeLabel = computed(() =>
  theme.value === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
)

watch(
  messages,
  async () => {
    await nextTick()
    chatEnd.value?.scrollIntoView({ behavior: "smooth" })
  },
  { deep: true },
)
</script>

<template>
  <div class="app">
    <!-- Pantalla de login -->
    <LoginView v-if="!session" />

    <!-- Chat principal -->
    <template v-else>
      <header class="app-header" role="banner">
        <!-- Logo + Nombre -->
        <div class="header-brand" aria-label="Kora AI Chat">
          <div class="brand-logo" aria-hidden="true">
            <Sparkles :size="18" />
          </div>
          <div class="brand-text">
            <span class="brand-name">Kora</span>
            <span class="brand-badge">AI</span>
          </div>
        </div>

        <!-- Acciones del header -->
        <div class="header-actions">
          <!-- Toggle de tema -->
          <button
            class="btn-icon"
            :aria-label="themeLabel"
            :title="themeLabel"
            @click="toggleTheme"
          >
            <component :is="themeIcon" :size="18" />
          </button>

          <!-- Separador visual -->
          <div class="header-divider" aria-hidden="true" />

          <!-- Cerrar sesión -->
          <button
            class="btn-signout"
            :disabled="authLoading"
            :aria-label="authLoading ? 'Cerrando sesión…' : 'Cerrar sesión'"
            title="Cerrar sesión"
            @click="signOut"
          >
            <LogOut :size="16" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <!-- Ventana de chat -->
      <main
        class="chat-window"
        role="log"
        aria-label="Conversación con Kora"
        aria-live="polite"
        aria-atomic="false"
      >
        <!-- Estado vacío -->
        <div v-if="messages.length === 0" class="empty-state" aria-live="polite">
          <div class="empty-icon" aria-hidden="true">
            <MessageSquare :size="40" />
          </div>
          <h2 class="empty-title">¡Hola! Soy Kora</h2>
          <p class="empty-subtitle">
            Agente de IA impulsado por Google Gemini.<br />
            ¿En qué puedo ayudarte hoy?
          </p>
          <div class="empty-suggestions" role="list" aria-label="Sugerencias de inicio">
            <button
              v-for="hint in ['¿Qué puedes hacer?', 'Explícame algo complejo', 'Escribe un resumen']"
              :key="hint"
              class="suggestion-chip"
              role="listitem"
              @click="sendMessage(hint)"
            >
              {{ hint }}
            </button>
          </div>
        </div>

        <ChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
        />

        <div
          v-if="error"
          class="error-banner"
          role="alert"
          aria-live="assertive"
        >
          <span>⚠️ {{ error }}</span>
        </div>

        <div ref="chatEnd" aria-hidden="true" />
      </main>

      <ChatInput
        @send="sendMessage"
        @clear="clearChat"
        :disabled="isLoading"
      />
    </template>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-header-bg);
  border-bottom: 1px solid var(--color-header-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  transition: background var(--transition-slow), border-color var(--transition-slow);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: var(--avatar-ai-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.brand-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1;
}

.brand-badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
  padding: 0.1em 0.45em;
  line-height: 1.4;
  opacity: 0.85;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-divider {
  width: 1px;
  height: 1.25rem;
  background: var(--color-border);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
}

.btn-signout {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: var(--font-sans);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.btn-signout:hover:not(:disabled) {
  background: var(--color-error-subtle);
  border-color: var(--color-error);
  color: var(--color-error);
}

.btn-signout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Ventana de chat ─────────────────────────────────────────────────────────── */
.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Estado vacío ───────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  margin: auto;
  padding: 2rem 1rem;
  animation: fadeSlideUp var(--transition-slow) ease;
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-2xl);
  background: var(--avatar-ai-bg);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  box-shadow: var(--shadow-lg);
}

.empty-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.empty-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  max-width: 340px;
}

.empty-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.suggestion-chip {
  padding: 0.4375rem 0.875rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: var(--font-sans);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.suggestion-chip:hover {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* ── Error ──────────────────────────────────────────────────────────────────── */
.error-banner {
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-error-subtle);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
}
</style>
