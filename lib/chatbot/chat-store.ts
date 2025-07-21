import { create } from "zustand"
import { OpenRouterClient } from "./openrouter-client"
import { SYSTEM_PROMPT } from "./system-prompt"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  isOpen: boolean
  openRouterClient: OpenRouterClient | null
  apiKeyValid: boolean

  // Actions
  addMessage: (content: string, role: "user" | "assistant") => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  toggleChat: () => void
  initializeClient: (apiKey: string) => Promise<void>
  validateConnection: () => Promise<boolean>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm ZeruBot, your assistant for the Zeru Gas Tracker application. I can help answer questions about how the gas tracker works, its features, and technical details. What would you like to know?",
      timestamp: Date.now(),
    },
  ],
  isLoading: false,
  isOpen: false,
  openRouterClient: null,
  apiKeyValid: false,

  addMessage: (content, role) => {
    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
    }
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  sendMessage: async (content) => {
    const { openRouterClient, addMessage, apiKeyValid } = get()

    if (!openRouterClient) {
      addMessage("Please configure your OpenRouter API key in the environment variables.", "assistant")
      return
    }

    if (!apiKeyValid) {
      addMessage("API key validation failed. Please check your OpenRouter configuration.", "assistant")
      return
    }

    // Add user message
    addMessage(content, "user")
    set({ isLoading: true })

    try {
      // Prepare messages for API (keep last 8 messages for context)
      const recentMessages = get().messages.slice(-8)
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content },
      ]

      // Get AI response
      const response = await openRouterClient.chat(messages)
      addMessage(response, "assistant")
    } catch (error) {
      console.error("Chat error:", error)
      addMessage("I encountered an error processing your request. Please try again.", "assistant")
    } finally {
      set({ isLoading: false })
    }
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm ZeruBot, your assistant for the Zeru Gas Tracker application. I can help answer questions about how the gas tracker works, its features, and technical details. What would you like to know?",
          timestamp: Date.now(),
        },
      ],
    })
  },

  toggleChat: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },

  initializeClient: async (apiKey) => {
    const client = new OpenRouterClient(apiKey)
    set({ openRouterClient: client })

    // Validate the API key
    try {
      const isValid = await client.validateApiKey()
      set({ apiKeyValid: isValid })

      if (!isValid) {
        console.warn("OpenRouter API key validation failed")
      }
    } catch (error) {
      console.error("Failed to validate OpenRouter API key:", error)
      set({ apiKeyValid: false })
    }
  },

  validateConnection: async () => {
    const { openRouterClient } = get()
    if (!openRouterClient) return false

    try {
      const isValid = await openRouterClient.validateApiKey()
      set({ apiKeyValid: isValid })
      return isValid
    } catch {
      set({ apiKeyValid: false })
      return false
    }
  },
}))
