"use client"

import { useGasStore } from "@/lib/store/gas-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface GasPriceWidgetProps {
  chain: "ethereum" | "polygon" | "arbitrum"
}

const chainConfig = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    token: "ETH" as const,
    color: "bg-green-500",
    textColor: "text-green-600",
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    token: "MATIC" as const,
    color: "bg-purple-500",
    textColor: "text-purple-600",
  },
  arbitrum: {
    name: "Arbitrum",
    symbol: "ETH",
    token: "ETH" as const,
    color: "bg-cyan-500",
    textColor: "text-cyan-600",
  },
}

export function GasPriceWidget({ chain }: GasPriceWidgetProps) {
  const { chains, tokenPrices } = useGasStore()
  const chainData = chains[chain]
  const config = chainConfig[chain]

  const currentGas = chainData.baseFee + chainData.priorityFee
  const previousGas =
    chainData.history.length > 1 ? chainData.history[chainData.history.length - 2].totalFee : currentGas

  const trend = currentGas > previousGas ? "up" : currentGas < previousGas ? "down" : "stable"
  const trendPercentage = previousGas > 0 ? ((currentGas - previousGas) / previousGas) * 100 : 0

  // Use the correct token price for each chain
  const tokenPrice = tokenPrices[config.token]
  const standardTxCost = (currentGas * 21000) / 1e9 // Convert gwei to token units for 21k gas
  const standardTxCostUsd = standardTxCost * tokenPrice

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-500"
      case "down":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card
      className="text-black border-2"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#1A1B30",
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-black font-heading">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            {config.name}
          </CardTitle>
          <Badge variant="outline" className={`${config.textColor} border-gray-400 bg-transparent font-content`}>
            {config.symbol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-content">Current Gas</span>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()} font-content`}>
                {Math.abs(trendPercentage).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-black font-content">
            {currentGas.toFixed(1)} <span className="text-sm font-normal text-gray-600">gwei</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm font-content">
          <div>
            <div className="text-gray-600">Base Fee</div>
            <div className="font-semibold text-black">{chainData.baseFee.toFixed(1)} gwei</div>
          </div>
          <div>
            <div className="text-gray-600">Priority Fee</div>
            <div className="font-semibold text-black">{chainData.priorityFee.toFixed(1)} gwei</div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-300">
          <div className="text-sm text-gray-600 font-content">Standard Transfer Cost</div>
          <div className="font-semibold text-black font-content">
            {standardTxCost.toFixed(6)} {config.symbol}
          </div>
          <div className="text-sm font-content" style={{ color: "#1A1B30" }}>
            ≈ ${standardTxCostUsd.toFixed(4)} USD
          </div>
        </div>

        <div className="text-xs text-gray-500 font-content">
          Last updated: {chainData.lastUpdate ? new Date(chainData.lastUpdate).toLocaleTimeString() : "Never"}
        </div>
      </CardContent>
    </Card>
  )
}
