"use client"

import { useEffect, useState } from "react"
import { useGasStore } from "@/lib/store/gas-store"
import { TransactionSimulator } from "@/components/transaction-simulator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function SimulationPanel() {
  const { mode, setMode } = useGasStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (mode === "simulation") {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [mode])

  const handleClose = () => {
    setMode("live")
  }

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Sliding Panel - Changed to slide from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l-2 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          borderColor: "#1A1B30",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Panel Header */}
        <div className="sticky top-0 bg-white border-b-2 p-4" style={{ borderColor: "#1A1B30" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black font-heading">Transaction Cost Simulator</h2>
              <p className="text-gray-600 font-content">Compare transaction costs across all chains in real-time</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="border-gray-400 text-gray-700 bg-white hover:bg-gray-100 hover:text-black font-content"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-6">
          <Card
            className="border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#1A1B30",
            }}
          >
            <CardHeader>
              <CardTitle className="text-black font-heading">Simulation Settings</CardTitle>
              <CardDescription className="text-gray-600 font-content">
                Enter your transaction details to compare costs across networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionSimulator />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="mt-6 space-y-4">
            <Card
              className="border-2"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#1A1B30",
              }}
            >
              <CardHeader>
                <CardTitle className="text-black text-lg font-heading">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-700 font-content">
                  <h4 className="font-semibold text-black mb-2 font-heading">Gas Calculation:</h4>
                  <ul className="space-y-1 ml-4">
                    <li>
                      • <strong>Ethereum:</strong> Base Fee + Priority Fee (dynamic)
                    </li>
                    <li>
                      • <strong>Polygon:</strong> Base Fee + 30 gwei priority fee
                    </li>
                    <li>
                      • <strong>Arbitrum:</strong> Base Fee + 0.1 gwei priority fee (L2 optimized)
                    </li>
                  </ul>
                </div>
                <div className="text-sm text-gray-700 font-content">
                  <h4 className="font-semibold text-black mb-2 font-heading">Cost Calculation:</h4>
                  <p>Total Cost = Transaction Value + (Gas Price × Gas Limit × Token Price)</p>
                </div>
                <div className="text-sm text-gray-700 font-content">
                  <h4 className="font-semibold text-black mb-2 font-heading">Real-time Pricing:</h4>
                  <p>Token prices are fetched from Chainlink price feeds every 60 seconds</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#1A1B30",
              }}
            >
              <CardHeader>
                <CardTitle className="text-black text-lg font-heading">Common Gas Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm font-content">
                  <div>
                    <h5 className="font-semibold text-black mb-2 font-heading">Basic Transactions:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• ETH Transfer: 21,000</li>
                      <li>• ERC-20 Transfer: 65,000</li>
                      <li>• ERC-20 Approval: 45,000</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-black mb-2 font-heading">DeFi Operations:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Uniswap Swap: 150,000</li>
                      <li>• Add Liquidity: 200,000</li>
                      <li>• NFT Mint: 100,000</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
