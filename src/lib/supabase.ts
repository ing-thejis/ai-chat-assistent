/**
 * @fileoverview Inicialización y exportación del cliente de Supabase.
 *
 * El cliente es un singleton creado a partir de las variables de entorno
 * inyectadas por Vite en tiempo de build/dev.
 *
 * Variables requeridas en .env.local:
 *   VITE_SUPABASE_URL       — URL del proyecto (ej. https://xxxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY  — Clave pública anon/public del proyecto
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY",
  )
}

// Función para refrescar token manualmente si es necesario
export const refreshToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing token:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to refresh token:", error)
    throw error
  }
}

// Función para obtener el token actual
export const getCurrentToken = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error("Error getting current token:", error)
    return null
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
