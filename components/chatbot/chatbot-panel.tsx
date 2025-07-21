"use client"

import { useEffect, useRef, useState } from "react"
import { useChatStore } from "@/lib/chatbot/chat-store"
import { ChatMessageComponent } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Button } from "@/components/ui/button"
import { X, Trash2, Settings, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"

export function ChatbotPanel() {
  const {
    messages,
    isLoading,
    isOpen,
    apiKeyValid,
    sendMessage,
    clearMessages,
    toggleChat,
    initializeClient,
    validateConnection,
  } = useChatStore()

  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize OpenRouter client
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    if (apiKey) {
      initializeClient(apiKey)
    }
  }, [initializeClient])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTestConnection = async () => {
    const isValid = await validateConnection()
    if (isValid) {
      alert("✅ Connection successful! ZeruBot is ready to help.")
    } else {
      alert("❌ Connection failed. Please check your API key configuration.")
    }
  }

  return (
    <>
      {/* Chat Toggle Button - Clean Logo Only */}
      <div className="fixed bottom-6 right-6 z-40">
        <div
          onClick={toggleChat}
          className={`relative cursor-pointer transition-all duration-200 ${
            isOpen ? "scale-90" : "scale-100"
          } hover:scale-105`}
        >
          {/* Zeru Logo - No Background */}
          <Image
            src="/zeru.png"
            alt="ZeruBot"
            width={48}
            height={48}
            className="drop-shadow-lg transition-all duration-200 hover:drop-shadow-xl"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
            }}
            priority
          />

          {/* Connection Status Indicator */}
          <div
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${
              apiKeyValid ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
            onClick={toggleChat}
          />

          {/* Chat Window */}
          <div
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border-2 rounded-lg shadow-xl z-50 flex flex-col"
            style={{ borderColor: "#1A1B30" }}
          >
            {/* Header with Zeru Logo */}
            <div
              className="flex items-center justify-between p-4 border-b-2 text-white"
              style={{ backgroundColor: "#1A1B30", borderColor: "#1A1B30" }}
            >
              <div className="flex items-center gap-3">
                {/* Zeru Logo in Header */}
                <Image
                  src="/zeru.png"
                  alt="ZeruBot"
                  width={28}
                  height={28}
                  className="drop-shadow-sm"
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                  }}
                />
                <div>
                  <h3 className="font-semibold font-heading">ZeruBot</h3>
                  <div className="flex items-center gap-1 text-xs">
                    {apiKeyValid ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Connected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                  title="Clear Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="text-white hover:bg-white/20 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black font-content">OpenRouter Status:</span>
                    <div className="flex items-center gap-2">
                      {apiKeyValid ? (
                        <span className="text-xs text-green-600 font-content">✅ Connected</span>
                      ) : (
                        <span className="text-xs text-red-600 font-content">❌ Not Connected</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleTestConnection}
                    size="sm"
                    className="w-full text-white hover:opacity-90 font-content"
                    style={{ backgroundColor: "#1A1B30" }}
                  >
                    Test Connection
                  </Button>
                  <div className="text-xs text-gray-600 font-content">
                    Model: DeepSeek via OpenRouter
                    <br />
                    Need help? Check your NEXT_PUBLIC_OPENROUTER_API_KEY
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-lg px-4 py-2 text-white border-2"
                    style={{ backgroundColor: "#1A1B30", borderColor: "#1A1B30" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} disabled={!apiKeyValid} />
          </div>
        </>
      )}
    </>
  )
}
