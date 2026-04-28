/**
 * @fileoverview Composable principal que encapsula toda la lógica del chat:
 * estado reactivo, comunicación con la Edge Function de Supabase y renderizado
 * de Markdown.
 * @module composable/useChat
 */

import { ref } from "vue"
import { marked } from "marked"
import { supabase } from "../lib/supabase"
import type { Message } from "../types/chat"

/**
 * Nombre de la Edge Function de Supabase que maneja el chat.
 * Debe coincidir con el directorio en `supabase/functions/<EDGE_FUNCTION_NAME>`.
 */
const EDGE_FUNCTION_NAME = "ai-chat"

/**
 * Composable de Vue 3 para gestionar la conversación con el asistente de IA.
 *
 * Expone el estado reactivo de la conversación y las acciones disponibles.
 * La comunicación con el backend se realiza mediante streaming (ReadableStream)
 * llamando a una Edge Function de Supabase para mostrar la respuesta en tiempo real.
 *
 * @example
 * const { messages, isLoading, sendMessage, clearChat } = useChat();
 * await sendMessage("Hola, ¿cómo estás?");
 */
export function useChat() {
  /** Lista de mensajes de la conversación. */
  const messages = ref<Message[]>([])

  /** `true` mientras se espera respuesta del backend. */
  const isLoading = ref(false)

  /** Mensaje de error, o `null` si no hay error activo. */
  const error = ref<string | null>(null)

  /**
   * Construye el historial de mensajes previos para enviarlo al backend.
   * Excluye cualquier mensaje que aún esté en estado de streaming,
   * ya que su contenido podría estar incompleto.
   *
   * @returns Array de mensajes completos con rol y contenido.
   */
  const buildHistory = () =>
    messages.value
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }))

  /**
   * Construye los headers de autorización para llamar a la Edge Function.
   *
   * - Si hay una sesión activa, usa el JWT del usuario (`access_token`).
   * - Si no hay sesión (usuario anónimo), usa la clave `anon` del proyecto.
   *
   * @returns Headers con `Content-Type`, `Authorization` y `apikey`.
   */
  const buildAuthHeaders = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token =
      session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    }
  }

  /**
   * Envía un mensaje del usuario a la Edge Function de Supabase y procesa
   * la respuesta en streaming.
   *
   * Flujo de ejecución:
   * 1. Valida que el input no esté vacío y que no haya una petición en curso.
   * 2. Captura el historial previo antes de agregar el nuevo mensaje.
   * 3. Agrega el mensaje del usuario al array `messages`.
   * 4. Crea un mensaje placeholder del asistente con `isStreaming: true`.
   * 5. Obtiene los headers de autenticación de Supabase.
   * 6. Realiza un POST a la Edge Function `chat` con el mensaje e historial.
   * 7. Lee la respuesta chunk a chunk y actualiza el contenido del placeholder.
   * 8. Finaliza el streaming estableciendo `isStreaming: false`.
   * 9. En caso de error, muestra el mensaje de error y elimina el placeholder.
   *
   * @param userInput - Texto ingresado por el usuario.
   */
  const sendMessage = async (userInput: string) => {
    if (!userInput.trim() || isLoading.value) return

    error.value = null

    // Construye el historial ANTES de agregar el mensaje actual
    const history = buildHistory()

    // Agrega mensaje del usuario
    messages.value.push({
      id: crypto.randomUUID(),
      role: "USER",
      content: userInput,
    })

    // Placeholder del asistente con streaming
    const assistantId = crypto.randomUUID()
    messages.value.push({
      id: assistantId,
      role: "ASSISTANT",
      content: "",
      isStreaming: true,
    })

    isLoading.value = true

    try {
      // Construye headers con el token de autenticación de Supabase
      const headers = await buildAuthHeaders()

      // URL de la Edge Function: {SUPABASE_URL}/functions/v1/{nombre}
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userInput,
          history,
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      if (!response.body) throw new Error("No response body")

      // Leer el stream chunk a chunk
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const assistantMsg = messages.value.find((m) => m.id === assistantId)!

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMsg.content += decoder.decode(value, { stream: true })
      }

      assistantMsg.isStreaming = false
    } catch (e) {
      error.value = "Error al conectar con el servidor."
      messages.value = messages.value.filter((m) => m.id !== assistantId)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Limpia todos los mensajes de la conversación, restableciendo el estado inicial.
   */
  const clearChat = () => {
    messages.value = []
  }

  /**
   * Convierte una cadena de texto con formato Markdown a HTML.
   * Utiliza la librería `marked` para el parseo.
   *
   * @param content - Contenido en formato Markdown.
   * @returns HTML resultante del parseo.
   *
   * @example
   * renderMarkdown("**Hola mundo**"); // "<p><strong>Hola mundo</strong></p>"
   */
  const renderMarkdown = (content: string) => marked(content) as string

  return { messages, isLoading, error, sendMessage, clearChat, renderMarkdown }
}
