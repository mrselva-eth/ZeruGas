"use client"

import { useEffect } from "react"
import { useGasStore } from "@/lib/store/gas-store"
import { GasPriceWidget } from "@/components/gas-price-widget"
import { TransactionSimulator } from "@/components/transaction-simulator"
import { GasChart } from "@/components/gas-chart"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchTokenPrices } from "@/lib/store/gas-store"
import Image from "next/image"

export default function Dashboard() {
  const { initializeConnections, mode, tokenPrices } = useGasStore()

  useEffect(() => {
    initializeConnections()
  }, [initializeConnections])

  const isPriceStale = (lastUpdated: number) => {
    return Date.now() - lastUpdated > 5 * 60 * 1000
  }

  const refreshPrices = () => {
    const { providers } = useGasStore.getState()
    if (providers.ethereum) {
      fetchTokenPrices(providers.ethereum)
    }
  }

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
                <h1 className="text-3xl font-bold text-black">
                  <span style={{ color: "#1A1B30" }}>Z</span>eru <span style={{ color: "#1A1B30" }}>G</span>as{" "}
                  <span style={{ color: "#1A1B30" }}>T</span>racker
                </h1>
                <p className="text-gray-600">Real-time gas prices across Ethereum, Polygon, and Arbitrum</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm flex items-center gap-4">
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
                onClick={refreshPrices}
                className="border-gray-400 text-gray-700 bg-white hover:bg-gray-100 hover:text-black"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <ModeToggle />
          </div>
        </div>

        {/* Gas Price Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GasPriceWidget chain="ethereum" />
          <GasPriceWidget chain="polygon" />
          <GasPriceWidget chain="arbitrum" />
        </div>

        {/* Chart and Simulator */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card
            className="xl:col-span-2 border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-black">Gas Price Volatility Chart</CardTitle>
                  <CardDescription className="text-gray-600">
                    Real-time candlestick chart showing gas price movements across all networks
                  </CardDescription>
                </div>
                {/* Networks Legend */}
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold text-black">Networks:</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-black">
                      <div className="w-3 h-3 bg-green-500 rounded-sm flex-shrink-0"></div>
                      <span className="font-medium">Ethereum</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-black">
                      <div className="w-3 h-3 bg-purple-500 rounded-sm flex-shrink-0"></div>
                      <span className="font-medium">Polygon</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-black">
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
                <div className="text-xs text-gray-600 text-center space-y-0.5">
                  <div>Updated every 15 minutes</div>
                  <div>Hover for detailed values</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === "simulation" && (
            <Card
              className="xl:col-span-2 border-2"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#1A1B30",
              }}
            >
              <CardHeader>
                <CardTitle className="text-black">Transaction Cost Simulator</CardTitle>
                <CardDescription className="text-gray-600">
                  Compare transaction costs across all chains in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionSimulator />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
