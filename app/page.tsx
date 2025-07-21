"use client"

import { useEffect } from "react"
import { useGasStore } from "@/lib/store/gas-store"
import { GasPriceWidget } from "@/components/gas-price-widget"
import { GasChart } from "@/components/gas-chart"
import { ModeToggle } from "@/components/mode-toggle"
import { SimulationPanel } from "@/components/simulation-panel"
import { SequentialTypingAnimation } from "@/components/sequential-typing-animation"
import { ChatbotPanel } from "@/components/chatbot/chatbot-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ConnectionStatus } from "@/components/connection-status"

export default function Dashboard() {
  const { initializeConnections, mode, tokenPrices, refreshPrices } = useGasStore()

  useEffect(() => {
    initializeConnections()
  }, [initializeConnections])

  const isPriceStale = (lastUpdated: number) => {
    return Date.now() - lastUpdated > 5 * 60 * 1000
  }

  const handleRefreshPrices = () => {
    refreshPrices()
  }

  // Animation texts for heading and description
  const headingTexts = ["Zeru Gas Tracker", "Real-time Gas Monitor", "Cross-chain Gas Analytics", "Web3 Gas Dashboard"]

  const descriptionTexts = [
    "Real-time gas prices across Ethereum, Polygon, and Arbitrum",
    "Monitor transaction costs across multiple blockchain networks",
    "Compare gas fees and optimize your Web3 transactions",
    "Track network congestion and plan your transactions",
  ]

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#e9e9e9" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/zeru.png"
                alt="Zeru Gas Tracker Logo"
                width={48}
                height={48}
                className="rounded-lg"
                priority
              />
              <div>
                <SequentialTypingAnimation
                  headingTexts={headingTexts}
                  descriptionTexts={descriptionTexts}
                  headingClassName="text-3xl font-bold text-black font-heading"
                  descriptionClassName="text-gray-600 font-content"
                  headingCursorClassName="text-black font-normal"
                  descriptionCursorClassName="text-gray-600"
                  typingSpeed={120}
                  intervalDuration={2000}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm flex items-center gap-4 font-content">
              <div className="flex items-center gap-2">
                <span className="text-black">ETH:</span>
                <span className="font-mono font-semibold" style={{ color: "#1A1B30" }}>
                  ${tokenPrices.ETH.toFixed(2)}
                </span>
                {isPriceStale(tokenPrices.lastUpdated.ETH) && (
                  <div title="Price may be stale">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-black">MATIC:</span>
                <span className="font-mono font-semibold" style={{ color: "#1A1B30" }}>
                  ${tokenPrices.MATIC.toFixed(4)}
                </span>
                {isPriceStale(tokenPrices.lastUpdated.MATIC) && (
                  <div title="Price may be stale">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                className="border-gray-400 text-gray-700 bg-white hover:bg-gray-100 hover:text-black font-content"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <ConnectionStatus />
            <ModeToggle />
          </div>
        </div>

        {/* Gas Price Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GasPriceWidget chain="ethereum" />
          <GasPriceWidget chain="polygon" />
          <GasPriceWidget chain="arbitrum" />
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 gap-6">
          <Card
            className="border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-black font-heading">Gas Price Analytics</CardTitle>
                  <CardDescription className="text-gray-600 font-content">
                    Interactive candlestick chart with multiple timeframes and real-time data
                  </CardDescription>
                </div>
                {/* Networks Legend */}
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold text-black font-content">Networks:</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-black font-content">
                      <div className="w-3 h-3 bg-green-500 rounded-sm flex-shrink-0"></div>
                      <span className="font-medium">Ethereum</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-black font-content">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm flex-shrink-0"></div>
                      <span className="font-medium">Polygon</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-black font-content">
                      <div className="w-3 h-3 bg-cyan-500 rounded-sm flex-shrink-0"></div>
                      <span className="font-medium">Arbitrum</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative">
                <GasChart />
              </div>
              {/* Chart Info */}
              <div className="flex justify-center mt-3 pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-600 text-center space-y-0.5 font-content">
                  <div>Real-time data with customizable timeframes</div>
                  <div>Hover over chart for detailed values</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simulation Panel */}
      <SimulationPanel />

      {/* Chatbot */}
      <ChatbotPanel />
    </div>
  )
}
