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
import { Mail, ArrowRight, KeyRound, RotateCcw } from "@lucide/vue"
import { useAuth } from "../composable/useAuth"

const { isLoading, error, sendOtp, verifyOtp } = useAuth()

// ── Estado del formulario ──────────────────────────────────────────────────
type Step = "email" | "otp"
const step = ref<Step>("email")

const email = ref("")
const otp = ref("")

// ── Validaciones ──────────────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => emailRegex.test(email.value.trim()))
const isOtpValid = computed(() => /^\d{6}$/.test(otp.value.trim()))

// ── Acciones ──────────────────────────────────────────────────────────────

/** Paso 1: envía el OTP al correo. */
const handleSendOtp = async () => {
  if (!isEmailValid.value || isLoading.value) return
  const ok = await sendOtp(email.value.trim())
  if (ok) step.value = "otp"
}

/** Paso 2: verifica el código OTP ingresado. */
const handleVerifyOtp = async () => {
  if (!isOtpValid.value || isLoading.value) return
  await verifyOtp(email.value.trim(), otp.value.trim())
  // Si es correcto, onAuthStateChange en useAuth actualiza `session`
  // y App.vue deja de mostrar LoginView automáticamente.
}

/** Vuelve al paso 1 para cambiar el correo o reenviar el código. */
const handleBack = () => {
  step.value = "email"
  otp.value = ""
}

/** Permite enviar con Enter en los inputs. */
const handleEmailKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") handleSendOtp()
}

const handleOtpKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") handleVerifyOtp()
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">

      <!-- Ícono y título -->
      <div class="login-icon">✨</div>
      <h1>AI Chat</h1>

      <!-- ── Paso 1: Email ── -->
      <template v-if="step === 'email'">
        <p class="subtitle">
          Ingresa tu correo electrónico para recibir un código de acceso.
        </p>

        <div class="input-group">
          <label for="email-input">Correo electrónico</label>
          <div class="input-wrapper" :class="{ invalid: email && !isEmailValid }">
            <Mail :size="16" class="input-icon" />
            <input
              id="email-input"
              v-model="email"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              :disabled="isLoading"
              @keydown="handleEmailKeydown"
            />
          </div>
          <span v-if="email && !isEmailValid" class="field-error">
            Ingresa un correo válido.
          </span>
        </div>

        <button
          class="btn-primary"
          :disabled="!isEmailValid || isLoading"
          @click="handleSendOtp"
        >
          <span>{{ isLoading ? "Enviando código..." : "Continuar" }}</span>
          <ArrowRight v-if="!isLoading" :size="16" />
        </button>
      </template>

      <!-- ── Paso 2: OTP ── -->
      <template v-else>
        <p class="subtitle">
          Enviamos un código de 6 dígitos a <strong>{{ email }}</strong>.
          Revisa tu bandeja de entrada.
        </p>

        <div class="input-group">
          <label for="otp-input">Código de verificación</label>
          <div class="input-wrapper" :class="{ invalid: otp && !isOtpValid }">
            <KeyRound :size="16" class="input-icon" />
            <input
              id="otp-input"
              v-model="otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="123456"
              autocomplete="one-time-code"
              :disabled="isLoading"
              @keydown="handleOtpKeydown"
            />
          </div>
          <span v-if="otp && !isOtpValid" class="field-error">
            El código debe tener exactamente 6 dígitos.
          </span>
        </div>

        <button
          class="btn-primary"
          :disabled="!isOtpValid || isLoading"
          @click="handleVerifyOtp"
        >
          <span>{{ isLoading ? "Verificando..." : "Verificar código" }}</span>
          <ArrowRight v-if="!isLoading" :size="16" />
        </button>

        <button class="btn-back" :disabled="isLoading" @click="handleBack">
          <RotateCcw :size="14" />
          <span>Cambiar correo o reenviar código</span>
        </button>
      </template>

      <!-- Error global -->
      <p v-if="error" class="error">{{ error }}</p>

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
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  padding: 2.5rem 2rem;
  border-radius: 1rem;
  border: 1px solid #ddd;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-icon {
  font-size: 2.5rem;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  color: #555;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ── Input ── */
.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #333;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input-wrapper:focus-within {
  border-color: #3c3c3c;
}

.input-wrapper.invalid {
  border-color: #c0392b;
}

.input-icon {
  color: #888;
  flex-shrink: 0;
}

input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  background: transparent;
  color: inherit;
  min-width: 0;
}

input::placeholder {
  color: #bbb;
}

input:disabled {
  opacity: 0.6;
}

.field-error {
  font-size: 0.75rem;
  color: #c0392b;
}

/* ── Botones ── */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  background-color: #3c3c3c;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4f4f4f;
}

.btn-primary:disabled {
  background-color: #bbb;
  cursor: not-allowed;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.btn-back:hover:not(:disabled) {
  color: #333;
}

.btn-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}
</style>
