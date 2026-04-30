/**
 * @fileoverview Composable para gestionar el tema visual (light / dark / system).
 *
 * - Lee la preferencia del sistema operativo por defecto.
 * - Persiste la elección del usuario en localStorage.
 * - Aplica / remueve la clase `dark` en el elemento <html>.
 *
 * @composable useTheme
 */

import { ref, watch, onMounted } from "vue"

type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "kora-theme"

/** Estado global del tema (singleton — se comparte entre todos los llamadores). */
const current = ref<Theme>("system")

/** Devuelve true si el sistema operativo prefiere dark. */
const systemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches

/** Aplica la clase `dark` al <html> según el tema activo. */
const applyTheme = (theme: Theme) => {
  const html = document.documentElement
  const useDark = theme === "dark" || (theme === "system" && systemPrefersDark())
  html.classList.toggle("dark", useDark)
}

export function useTheme() {
  onMounted(() => {
    // Leer preferencia guardada
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    current.value = saved ?? "system"
    applyTheme(current.value)

    // Reaccionar a cambios del sistema cuando el tema es "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", () => {
      if (current.value === "system") applyTheme("system")
    })
  })

  watch(current, (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
  })

  /** Alterna entre light y dark (si estaba en system, toma el valor opuesto al sistema). */
  const toggleTheme = () => {
    if (current.value === "dark") {
      current.value = "light"
    } else {
      current.value = "dark"
    }
  }

  /** true cuando el tema activo resulta en modo oscuro. */
  const isDark = () =>
    current.value === "dark" ||
    (current.value === "system" && systemPrefersDark())

  return { current, toggleTheme, isDark }
}
