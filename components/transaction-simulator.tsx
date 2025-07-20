"use client"

import { useState } from "react"
import { useGasStore } from "@/lib/store/gas-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator } from "lucide-react"

const chainConfig = {
  ethereum: { name: "Ethereum", symbol: "ETH", token: "ETH" as const },
  polygon: { name: "Polygon", symbol: "MATIC", token: "MATIC" as const },
  arbitrum: { name: "Arbitrum", symbol: "ETH", token: "ETH" as const },
}

export function TransactionSimulator() {
  const [transactionValue, setTransactionValue] = useState("0.5")
  const [gasLimit, setGasLimit] = useState("21000")
  const { chains, tokenPrices } = useGasStore()

  const calculateCosts = () => {
    const txValue = Number.parseFloat(transactionValue) || 0
    const gasLimitNum = Number.parseInt(gasLimit) || 21000

    return Object.entries(chains).map(([chainName, chainData]) => {
      const config = chainConfig[chainName as keyof typeof chainConfig]
      const totalGasPrice = chainData.baseFee + chainData.priorityFee
      const tokenPrice = tokenPrices[config.token]

      const gasCostToken = (totalGasPrice * gasLimitNum) / 1e9 // Convert gwei to token units
      const gasCostUsd = gasCostToken * tokenPrice
      const totalCostToken = txValue + gasCostToken
      const totalCostUsd = totalCostToken * tokenPrice

      return {
        chain: chainName,
        config,
        gasCostToken,
        gasCostUsd,
        totalCostToken,
        totalCostUsd,
        gasPrice: totalGasPrice,
      }
    })
  }

  const costs = calculateCosts()
  const cheapestChain = costs.reduce((min, current) => (current.gasCostUsd < min.gasCostUsd ? current : min))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="txValue" className="text-black">
            Transaction Value
          </Label>
          <Input
            id="txValue"
            type="number"
            step="0.001"
            value={transactionValue}
            onChange={(e) => setTransactionValue(e.target.value)}
            placeholder="0.5"
            className="text-black border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          />
        </div>
        <div>
          <Label htmlFor="gasLimit" className="text-black">
            Gas Limit
          </Label>
          <Input
            id="gasLimit"
            type="number"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            placeholder="21000"
            className="text-black border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {costs.map((cost) => (
          <Card
            key={cost.chain}
            className={`border-2 ${cost.chain === cheapestChain.chain ? "ring-2 ring-green-500" : ""}`}
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold capitalize flex items-center gap-2 text-black">
                    {cost.config.name}
                    {cost.chain === cheapestChain.chain && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Cheapest</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Gas: {cost.gasPrice.toFixed(1)} gwei • {cost.config.symbol}: $
                    {tokenPrices[cost.config.token].toFixed(cost.config.token === "MATIC" ? 4 : 2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-black">${cost.totalCostUsd.toFixed(4)}</div>
                  <div className="text-sm text-gray-600">Gas: ${cost.gasCostUsd.toFixed(4)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        <Calculator className="inline h-4 w-4 mr-1" />
        Calculations use real-time token prices: ETH ${tokenPrices.ETH.toFixed(2)}, MATIC $
        {tokenPrices.MATIC.toFixed(4)}
      </div>
    </div>
  )
}
