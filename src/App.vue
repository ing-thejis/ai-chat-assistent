<script setup lang="ts">
/**
 * @fileoverview Componente raíz de la aplicación.
 *
 * Actúa como orquestador del layout principal: muestra la pantalla de login
 * si el usuario no tiene sesión activa, o el chat si ya está autenticado.
 *
 * @component App
 */

import { ref, nextTick, watch } from "vue"
import { LogOut } from "@lucide/vue"
import ChatMessage from "./components/ChatMessage.vue"
import ChatInput from "./components/ChatInput.vue"
import LoginView from "./components/LoginView.vue"
import { useChat } from "./composable/useChat"
import { useAuth } from "./composable/useAuth"

const { messages, isLoading, error, sendMessage, clearChat } = useChat()
const { session, isLoading: authLoading, signOut } = useAuth()


/** Referencia al elemento centinela al final del chat, usado para el auto-scroll. */
const chatEnd = ref<HTMLElement | null>(null)

/**
 * Observa cambios en el array de mensajes (incluyendo mutaciones profundas como
 * actualizaciones de contenido durante el streaming) y desplaza la vista
 * suavemente hasta el último mensaje tras el siguiente ciclo de renderizado.
 */
watch(messages, async () => {
  await nextTick()
  chatEnd.value?.scrollIntoView({ behavior: "smooth" })
}, { deep: true })
</script>

<template>
  <div class="app">
    <!-- Pantalla de login: visible cuando no hay sesión activa -->
    <LoginView v-if="!session" />

    <!-- Chat: visible cuando hay sesión activa -->
    <template v-else>
      <header>
        <h1>✨ AI Chat</h1>
        <button class="btn-signout" :disabled="authLoading" @click="signOut" title="Cerrar sesión">
          <LogOut :size="16" />
          <span>Salir</span>
        </button>
      </header>

      <main class="chat-window">
        <div v-if="messages.length === 0" class="empty-state">
          <p>👋 ¡Hola! Soy Kora, un agente de IA que usa modelos de Google Gemini. ¿En qué puedo ayudarte?</p>
        </div>

        <ChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
        />

        <div v-if="error" class="error">{{ error }}</div>
        <div ref="chatEnd" />
      </main>

      <ChatInput @send="sendMessage" @clear="clearChat" :disabled="isLoading" />
    </template>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

header h1 {
  margin: 0;
}

.btn-signout {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  background: transparent;
  color: #555;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.btn-signout:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #222;
}

.btn-signout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  box-shadow: 10px 10px 10px 10px rgba(50, 50, 50, 0.1);
}

.empty-state {
  text-align: center;
  margin-top: 2rem;
}

.error {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
