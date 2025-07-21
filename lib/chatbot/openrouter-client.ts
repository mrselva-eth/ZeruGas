// OpenRouter client for DeepSeek models - Simplified responses
export class OpenRouterClient {
  private apiKey: string
  private baseUrl = "https://openrouter.ai/api/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Zeru Gas Tracker",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages,
          temperature: 0.3, // Lower temperature for more consistent, factual responses
          max_tokens: 800, // Reduced for more concise responses
          stream: false,
          top_p: 0.8,
          frequency_penalty: 0.2, // Reduce repetition
          presence_penalty: 0.1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || "I couldn't generate a response. Please try again."
    } catch (error) {
      console.error("OpenRouter API Error:", error)

      // Provide clean error messages without emojis
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          return "API key invalid. Please check your OpenRouter API key configuration."
        }
        if (error.message.includes("429")) {
          return "Rate limit reached. Please wait a moment before trying again."
        }
        if (error.message.includes("insufficient")) {
          return "Insufficient credits. Please check your OpenRouter account balance."
        }
      }

      return "I'm having trouble connecting to the AI service. Please try again in a moment."
    }
  }

  // Method to check API key validity
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Method to get available models
  async getModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Failed to fetch models:", error)
    }
    return null
  }
}
