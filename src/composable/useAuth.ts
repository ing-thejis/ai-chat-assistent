/**
 * @fileoverview Composable para gestionar el estado de autenticación con Supabase.
 *
 * Flujo de autenticación:
 *   1. `sendOtp(email)`  → Supabase envía un código de 6 dígitos al correo.
 *   2. `verifyOtp(email, token)` → Valida el código y establece la sesión.
 *   3. `signOut()` → Cierra la sesión activa.
 *
 * @module composable/useAuth
 */

import { ref, onUnmounted } from "vue"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export function useAuth() {
  /** Sesión activa de Supabase, o `null` si el usuario no está autenticado. */
  const session = ref<Session | null>(null)

  /** `true` mientras se procesa cualquier operación de auth. */
  const isLoading = ref(false)

  /** Mensaje de error, o `null` si no hay error activo. */
  const error = ref<string | null>(null)

  // Restaura la sesión que ya existe en localStorage (si la hay)
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  // Suscripción a cambios de estado: login, logout, token refresh
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
  })

  onUnmounted(() => {
    authListener.subscription.unsubscribe()
  })

  /**
   * Envía un OTP de 6 dígitos al correo indicado.
   * Supabase también puede enviar un magic link — el OTP es el código numérico
   * que aparece en el mismo email.
   *
   * @param email - Correo electrónico del usuario.
   * @returns `true` si el envío fue exitoso, `false` si hubo error.
   */
  const sendOtp = async (email: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (authError) throw authError
      return true
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "No se pudo enviar el código. Inténtalo de nuevo."
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Verifica el OTP ingresado por el usuario.
   * Si es correcto, Supabase establece la sesión automáticamente.
   *
   * @param email - Correo al que se envió el OTP.
   * @param token - Código de 6 dígitos ingresado por el usuario.
   * @returns `true` si la verificación fue exitosa, `false` si hubo error.
   */
  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      })
      if (authError) throw authError
      return true
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Código incorrecto o expirado. Inténtalo de nuevo."
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cierra la sesión activa.
   */
  const signOut = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
    } catch (e: unknown) {
      error.value =
        e instanceof Error ? e.message : "Error al cerrar sesión."
    } finally {
      isLoading.value = false
    }
  }

  return { session, isLoading, error, sendOtp, verifyOtp, signOut }
}
