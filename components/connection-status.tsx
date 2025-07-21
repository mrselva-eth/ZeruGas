"use client"

import { useEffect, useState } from "react"
import { useGasStore } from "@/lib/store/gas-store"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"

export function ConnectionStatus() {
  const { isConnected, providers } = useGasStore()
  const [connectionDetails, setConnectionDetails] = useState<{
    ethereum: boolean
    polygon: boolean
    arbitrum: boolean
  }>({
    ethereum: false,
    polygon: false,
    arbitrum: false,
  })

  useEffect(() => {
    const checkConnections = async () => {
      const details = {
        ethereum: false,
        polygon: false,
        arbitrum: false,
      }

      if (providers.ethereum) {
        try {
          await providers.ethereum.getNetwork()
          details.ethereum = true
        } catch {
          details.ethereum = false
        }
      }

      if (providers.polygon) {
        try {
          await providers.polygon.getNetwork()
          details.polygon = true
        } catch {
          details.polygon = false
        }
      }

      if (providers.arbitrum) {
        try {
          await providers.arbitrum.getNetwork()
          details.arbitrum = true
        } catch {
          details.arbitrum = false
        }
      }

      setConnectionDetails(details)
    }

    if (isConnected) {
      checkConnections()
      const interval = setInterval(checkConnections, 10000) // Check every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected, providers])

  const connectedCount = Object.values(connectionDetails).filter(Boolean).length
  const totalCount = 3

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {isConnected && connectedCount > 0 ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <span className="text-sm font-medium text-black font-content">
          {connectedCount}/{totalCount} Networks
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Badge variant={connectionDetails.ethereum ? "default" : "destructive"} className="text-xs">
          ETH
        </Badge>
        <Badge variant={connectionDetails.polygon ? "default" : "destructive"} className="text-xs">
          MATIC
        </Badge>
        <Badge variant={connectionDetails.arbitrum ? "default" : "destructive"} className="text-xs">
          ARB
        </Badge>
      </div>

      {!isConnected && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-content">Disconnected</span>
        </div>
      )}
    </div>
  )
}
