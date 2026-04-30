<script setup lang="ts">
/**
 * @fileoverview Componente que renderiza un mensaje individual del chat.
 *
 * Muestra el avatar del emisor, el contenido en Markdown renderizado y un
 * cursor parpadeante mientras el mensaje del asistente está en streaming.
 *
 * @component ChatMessage
 * @prop {Message} message - El objeto mensaje a renderizar.
 */

import { computed } from "vue"
import { User, Sparkles } from "@lucide/vue"
import { useChat } from "../composable/useChat"
import type { Message } from "../types/chat"

const { renderMarkdown } = useChat()

const props = defineProps<{ message: Message }>()

const isUser = computed(() => props.message.role === "USER")

/** Formato de hora local, ej. "14:32" */
const timestamp = computed(() => {
  const d = new Date()
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
})

/** Rol legible para ARIA */
const roleLabel = computed(() => (isUser.value ? "Tú" : "Kora"))
</script>

<template>
  <article
    :class="['message', message.role]"
    :aria-label="`Mensaje de ${roleLabel}`"
  >
    <!-- Avatar -->
    <div
      :class="['avatar', message.role]"
      role="img"
      :aria-label="isUser ? 'Tu avatar' : 'Avatar de Kora'"
    >
      <User v-if="isUser" :size="16" aria-hidden="true" />
      <Sparkles v-else :size="16" aria-hidden="true" />
    </div>

    <!-- Burbuja del mensaje -->
    <div :class="['bubble', message.role]">
      <!-- Thinking indicator -->
      <div
        v-if="message.isStreaming && !message.content"
        class="thinking"
        role="status"
        aria-label="Kora está escribiendo"
      >
        <span class="thinking-dot" aria-hidden="true" />
        <span class="thinking-dot" aria-hidden="true" />
        <span class="thinking-dot" aria-hidden="true" />
      </div>

      <!-- Contenido Markdown -->
      <div
        v-else
        class="markdown-body"
        v-html="renderMarkdown(message.content)"
        :aria-label="`Contenido del mensaje de ${roleLabel}`"
      />

      <!-- Cursor de streaming -->
      <span
        v-if="message.isStreaming && message.content"
        class="cursor"
        aria-hidden="true"
      >▋</span>

      <!-- Timestamp -->
      <div class="timestamp" aria-label="`Enviado a las ${timestamp}`">
        {{ timestamp }}
      </div>
    </div>
  </article>
</template>

<style scoped>
.message {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  margin-bottom: 1rem;
  animation: fadeSlideUp 200ms ease;
}

.message.USER {
  flex-direction: row-reverse;
}

/* ── Avatar ──────────────────────────────────────────────────────────────────── */
.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-sm);
}

.avatar.USER {
  background: var(--avatar-user-bg);
}

.avatar.ASSISTANT {
  background: var(--avatar-ai-bg);
}

/* ── Burbuja ─────────────────────────────────────────────────────────────────── */
.bubble {
  max-width: min(75%, 640px);
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-xl);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.bubble.USER {
  background: var(--color-bubble-user-bg);
  color: var(--color-bubble-user-text);
  border-radius: var(--radius-xl) var(--radius-sm) var(--radius-xl) var(--radius-xl);
}

.bubble.ASSISTANT {
  background: var(--color-bubble-ai-bg);
  color: var(--color-bubble-ai-text);
  border: 1px solid var(--color-bubble-ai-border);
  border-radius: var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-xl);
  transition:
    background-color var(--transition-slow),
    border-color var(--transition-slow);
}

/* ── Thinking dots ───────────────────────────────────────────────────────────── */
.thinking {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.125rem;
  height: 1.5rem;
}

.thinking-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-text-muted);
  animation: pulse-dot 1.4s ease-in-out infinite;
}

.thinking-dot:nth-child(1) { animation-delay: 0s; }
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }

/* ── Cursor de streaming ─────────────────────────────────────────────────────── */
.cursor {
  display: inline-block;
  color: var(--color-primary);
  animation: blink 0.9s step-end infinite;
  font-size: 0.875em;
  margin-left: 1px;
  vertical-align: text-bottom;
}

/* ── Timestamp ───────────────────────────────────────────────────────────────── */
.timestamp {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-top: 0.375rem;
  line-height: 1;
  user-select: none;
}

.message.USER .timestamp {
  text-align: right;
  color: rgba(255, 255, 255, 0.55);
}

.message.ASSISTANT .timestamp {
  text-align: left;
}
</style>
