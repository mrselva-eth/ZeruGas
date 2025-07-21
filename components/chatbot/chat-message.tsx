"use client"

import type { ChatMessage } from "@/lib/chatbot/chat-store"
import { User } from "lucide-react"
import Image from "next/image"

interface ChatMessageProps {
  message: ChatMessage
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${isUser ? "" : ""}`}>
        {isUser ? (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        ) : (
          <Image src="/zeru.png" alt="ZeruBot" width={24} height={24} className="drop-shadow-sm" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? "bg-gray-100 text-black border border-gray-300" : "text-white border-2"
        }`}
        style={!isUser ? { backgroundColor: "#1A1B30", borderColor: "#1A1B30" } : {}}
      >
        <div className={`text-sm font-content whitespace-pre-wrap ${isUser ? "text-black" : "text-white"}`}>
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isUser ? "text-gray-500" : "text-gray-300"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}
