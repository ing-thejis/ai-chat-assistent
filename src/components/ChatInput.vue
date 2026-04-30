<script setup lang="ts">
/**
 * @fileoverview Componente de entrada de mensajes del chat.
 *
 * Proporciona un textarea con auto-resize, botón de envío y botón de limpiar.
 * Enter envía, Shift+Enter hace salto de línea.
 *
 * @component ChatInput
 * @emits send  - Texto del mensaje cuando el usuario lo envía.
 * @emits clear - Cuando el usuario limpia la conversación.
 */

import { ref, computed } from "vue"
import { Send, Trash2 } from "@lucide/vue"

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [value: string]; clear: [] }>()

const input = ref("")
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const hasContent = computed(() => input.value.trim().length > 0)
const charCount = computed(() => input.value.length)
const isNearLimit = computed(() => charCount.value > 3800)

const handleSend = () => {
  if (!hasContent.value || props.disabled) return
  emit("send", input.value)
  input.value = ""
  // Reset height del textarea
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto"
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/** Auto-resize del textarea según el contenido */
const handleInput = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = "auto"
  el.style.height = Math.min(el.scrollHeight, 200) + "px"
}

const handleClear = () => {
  if (confirm("¿Limpiar toda la conversación?")) {
    emit("clear")
  }
}
</script>

<template>
  <footer class="input-area" role="form" aria-label="Composición de mensaje">
    <div class="input-container" :class="{ focused: hasContent }">
      <!-- Textarea principal -->
      <textarea
        id="input-chat"
        ref="textareaRef"
        v-model="input"
        placeholder="Escribe un mensaje…"
        rows="1"
        :disabled="disabled"
        :aria-disabled="disabled"
        :aria-label="disabled ? 'Kora está respondiendo, espera un momento' : 'Escribe tu mensaje aquí'"
        aria-multiline="true"
        :aria-describedby="isNearLimit ? 'char-warning' : undefined"
        @keydown="handleKeydown"
        @input="handleInput"
      />

      <!-- Acciones dentro del input -->
      <div class="input-actions">
        <!-- Hint de teclado -->
        <span class="keyboard-hint" aria-hidden="true">
          <kbd>Enter</kbd> enviar · <kbd>⇧ Enter</kbd> nueva línea
        </span>

        <div class="action-buttons">
          <!-- Limpiar chat -->
          <button
            type="button"
            class="btn-ghost"
            :disabled="disabled"
            aria-label="Limpiar conversación"
            title="Limpiar conversación"
            @click="handleClear"
          >
            <Trash2 :size="16" aria-hidden="true" />
          </button>

          <!-- Enviar -->
          <button
            type="button"
            class="btn-send"
            :disabled="!hasContent || disabled"
            :class="{ 'btn-send--active': hasContent && !disabled }"
            aria-label="Enviar mensaje"
            title="Enviar mensaje (Enter)"
            @click="handleSend"
          >
            <Send :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- Aviso de caracteres cerca del límite -->
    <p
      v-if="isNearLimit"
      id="char-warning"
      class="char-warning"
      role="status"
    >
      {{ charCount }} / 4000 caracteres
    </p>

    <!-- Indicator de carga -->
    <div v-if="disabled" class="loading-bar" aria-hidden="true" />
  </footer>
</template>

<style scoped>
.input-area {
  flex-shrink: 0;
  padding: 0.75rem 0 1rem;
  position: relative;
}

/* ── Contenedor del input ────────────────────────────────────────────────────── */
.input-container {
  display: flex;
  flex-direction: column;
  background: var(--color-input-bg);
  border: 1.5px solid var(--color-input-border);
  border-radius: var(--radius-xl);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-slow);
  overflow: hidden;
}

.input-container:focus-within {
  border-color: var(--color-input-focus);
  box-shadow: var(--shadow-glow);
}

/* ── Textarea ────────────────────────────────────────────────────────────────── */
textarea {
  flex: 1;
  padding: 0.875rem 1rem 0.25rem;
  border: none;
  outline: none;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: transparent;
  resize: none;
  min-height: 44px;
  max-height: 200px;
  overflow-y: auto;
  transition: color var(--transition-slow);
}

textarea::placeholder {
  color: var(--color-text-muted);
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Acciones ────────────────────────────────────────────────────────────────── */
.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.625rem 0.5rem;
}

.keyboard-hint {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  display: none;
  gap: 0.25rem;
}

@media (min-width: 480px) {
  .keyboard-hint {
    display: flex;
    align-items: center;
  }
}

kbd {
  display: inline-block;
  font-size: 0.6875rem;
  font-family: var(--font-mono);
  padding: 0.1em 0.35em;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}

/* ── Botón ghost (limpiar) ───────────────────────────────────────────────────── */
.btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-error-subtle);
  color: var(--color-error);
}

.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Botón enviar ────────────────────────────────────────────────────────────── */
.btn-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  cursor: not-allowed;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.btn-send--active {
  background: var(--color-primary);
  color: var(--color-primary-text);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.btn-send--active:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-send--active:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-send:disabled:not(.btn-send--active) {
  opacity: 0.5;
}

/* ── Aviso de caracteres ─────────────────────────────────────────────────────── */
.char-warning {
  font-size: 0.75rem;
  color: var(--color-warning);
  text-align: right;
  margin-top: 0.25rem;
  padding: 0 0.25rem;
}

/* ── Barra de carga ──────────────────────────────────────────────────────────── */
.loading-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-primary) 40%,
    var(--color-primary-hover) 60%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-full);
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
</style>
