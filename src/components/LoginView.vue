<script setup lang="ts">
/**
 * @fileoverview Pantalla de autenticación por email con OTP de Supabase.
 *
 * Flujo en dos pasos:
 *   Paso 1 — El usuario ingresa su correo y recibe un código de 6 dígitos.
 *   Paso 2 — El usuario ingresa el código para verificar su identidad.
 *
 * @component LoginView
 */

import { ref, computed } from "vue"
import { Mail, ArrowRight, KeyRound, RotateCcw, Sparkles } from "@lucide/vue"
import { useAuth } from "../composable/useAuth"
import { useTheme } from "../composable/useTheme"

const { isLoading, error, sendOtp, verifyOtp } = useAuth()
const { current: theme, toggleTheme } = useTheme()

type Step = "email" | "otp"
const step = ref<Step>("email")
const email = ref("")
const otp = ref("")

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => emailRegex.test(email.value.trim()))
const isOtpValid = computed(() => /^\d{6}$/.test(otp.value.trim()))

const themeLabel = computed(() =>
  theme.value === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
)

const handleSendOtp = async () => {
  if (!isEmailValid.value || isLoading.value) return
  const ok = await sendOtp(email.value.trim())
  if (ok) step.value = "otp"
}

const handleVerifyOtp = async () => {
  if (!isOtpValid.value || isLoading.value) return
  await verifyOtp(email.value.trim(), otp.value.trim())
}

const handleBack = () => {
  step.value = "email"
  otp.value = ""
}

const handleEmailKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") handleSendOtp()
}

const handleOtpKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") handleVerifyOtp()
}
</script>

<template>
  <div class="login-wrapper">
    <!-- Toggle de tema esquina superior derecha -->
    <button
      class="theme-toggle"
      :aria-label="themeLabel"
      :title="themeLabel"
      @click="toggleTheme"
    >
      <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
    </button>

    <div
      class="login-card"
      role="main"
      aria-label="Iniciar sesión en Kora"
    >
      <!-- Logo y marca -->
      <div class="login-logo" aria-hidden="true">
        <Sparkles :size="28" />
      </div>
      <div class="login-brand">
        <h1 class="login-title">Kora</h1>
        <span class="login-subtitle-badge">AI Chat</span>
      </div>

      <!-- Indicador de pasos -->
      <div class="steps-indicator" role="progressbar" :aria-valuenow="step === 'email' ? 1 : 2" aria-valuemin="1" aria-valuemax="2" :aria-label="`Paso ${step === 'email' ? 1 : 2} de 2`">
        <div :class="['step-dot', { active: true }]" aria-hidden="true" />
        <div class="step-line" aria-hidden="true" />
        <div :class="['step-dot', { active: step === 'otp' }]" aria-hidden="true" />
      </div>

      <!-- ── Paso 1: Email ─────────────────────────────────────────── -->
      <Transition name="slide" mode="out-in">
        <div v-if="step === 'email'" key="email-step" class="step-content">
          <p class="step-description">
            Ingresa tu correo para recibir un código de acceso seguro.
          </p>

          <div class="form-group">
            <label for="email-input" class="form-label">
              Correo electrónico
            </label>
            <div
              class="input-wrapper"
              :class="{
                'input-wrapper--invalid': email && !isEmailValid,
                'input-wrapper--valid': email && isEmailValid,
              }"
            >
              <Mail :size="15" class="input-icon" aria-hidden="true" />
              <input
                id="email-input"
                v-model="email"
                type="email"
                placeholder="tu@correo.com"
                autocomplete="email"
                :disabled="isLoading"
                aria-required="true"
                :aria-invalid="email && !isEmailValid ? 'true' : 'false'"
                aria-describedby="email-error"
                @keydown="handleEmailKeydown"
              />
            </div>
            <p
              v-if="email && !isEmailValid"
              id="email-error"
              class="field-error"
              role="alert"
            >
              Ingresa un correo electrónico válido.
            </p>
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="!isEmailValid || isLoading"
            :aria-busy="isLoading"
            @click="handleSendOtp"
          >
            <span class="btn-spinner" v-if="isLoading" aria-hidden="true" />
            <span>{{ isLoading ? "Enviando código…" : "Continuar" }}</span>
            <ArrowRight v-if="!isLoading" :size="16" aria-hidden="true" />
          </button>
        </div>

        <!-- ── Paso 2: OTP ───────────────────────────────────────────── -->
        <div v-else key="otp-step" class="step-content">
          <p class="step-description">
            Enviamos un código de 6 dígitos a<br />
            <strong class="email-highlight">{{ email }}</strong>
          </p>

          <div class="form-group">
            <label for="otp-input" class="form-label">
              Código de verificación
            </label>
            <div
              class="input-wrapper"
              :class="{
                'input-wrapper--invalid': otp && !isOtpValid,
                'input-wrapper--valid': otp && isOtpValid,
              }"
            >
              <KeyRound :size="15" class="input-icon" aria-hidden="true" />
              <input
                id="otp-input"
                v-model="otp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="• • • • • •"
                autocomplete="one-time-code"
                :disabled="isLoading"
                aria-required="true"
                :aria-invalid="otp && !isOtpValid ? 'true' : 'false'"
                aria-describedby="otp-error"
                @keydown="handleOtpKeydown"
              />
            </div>
            <p
              v-if="otp && !isOtpValid"
              id="otp-error"
              class="field-error"
              role="alert"
            >
              El código debe tener exactamente 6 dígitos.
            </p>
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="!isOtpValid || isLoading"
            :aria-busy="isLoading"
            @click="handleVerifyOtp"
          >
            <span class="btn-spinner" v-if="isLoading" aria-hidden="true" />
            <span>{{ isLoading ? "Verificando…" : "Verificar código" }}</span>
            <ArrowRight v-if="!isLoading" :size="16" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="btn-back"
            :disabled="isLoading"
            @click="handleBack"
          >
            <RotateCcw :size="13" aria-hidden="true" />
            <span>Cambiar correo o reenviar código</span>
          </button>
        </div>
      </Transition>

      <!-- Error global -->
      <p v-if="error" class="global-error" role="alert" aria-live="assertive">
        {{ error }}
      </p>

      <!-- Footer de la card -->
      <p class="login-footer">
        Acceso seguro · Sin contraseñas
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 1rem;
  position: relative;
}

/* ── Toggle tema ─────────────────────────────────────────────────────────────── */
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.theme-toggle:hover {
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-md);
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 2rem;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-xl);
  max-width: 420px;
  width: 100%;
  text-align: center;
  transition:
    background-color var(--transition-slow),
    border-color var(--transition-slow),
    box-shadow var(--transition-slow);
}

/* ── Logo ────────────────────────────────────────────────────────────────────── */
.login-logo {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  background: var(--avatar-ai-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-lg);
  margin-bottom: -0.5rem;
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1;
}

.login-subtitle-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
  opacity: 0.8;
}

/* ── Pasos indicator ─────────────────────────────────────────────────────────── */
.steps-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  transition: background-color var(--transition-normal), transform var(--transition-normal);
}

.step-dot.active {
  background: var(--color-primary);
  transform: scale(1.2);
}

.step-line {
  width: 32px;
  height: 2px;
  background: var(--color-border);
  border-radius: var(--radius-full);
}

/* ── Contenido del paso ──────────────────────────────────────────────────────── */
.step-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.step-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.email-highlight {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* ── Formulario ──────────────────────────────────────────────────────────────── */
.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  text-align: left;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: 1.5px solid var(--color-input-border);
  border-radius: var(--radius-lg);
  padding: 0.625rem 0.875rem;
  background: var(--color-input-bg);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.input-wrapper:focus-within {
  border-color: var(--color-input-focus);
  box-shadow: var(--shadow-glow);
}

.input-wrapper--invalid {
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
}

.input-wrapper--valid:not(:focus-within) {
  border-color: var(--color-success);
}

.input-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  font-family: var(--font-sans);
  background: transparent;
  color: var(--color-text-primary);
  min-width: 0;
}

input::placeholder {
  color: var(--color-text-muted);
}

input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin: 0;
}

/* ── Botón primario ──────────────────────────────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* Spinner del botón */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Botón volver ────────────────────────────────────────────────────────────── */
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-family: var(--font-sans);
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color var(--transition-fast);
}

.btn-back:hover:not(:disabled) {
  color: var(--color-primary);
}

.btn-back:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Error global ────────────────────────────────────────────────────────────── */
.global-error {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--color-error-subtle);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  font-size: 0.8125rem;
  text-align: center;
  margin: 0;
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
.login-footer {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
  padding-top: 0.25rem;
}

/* ── Transición de pasos ─────────────────────────────────────────────────────── */
.slide-enter-active,
.slide-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
