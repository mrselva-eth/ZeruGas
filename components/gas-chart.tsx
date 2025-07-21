"use client"

import { useEffect, useRef, useState } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
  ColorType,
  LineStyle,
} from "lightweight-charts"
import { useGasStore } from "@/lib/store/gas-store"
import { Button } from "@/components/ui/button"
import { BarChart3, Clock, Network } from "lucide-react"

type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
type NetworkFilter = "all" | "ethereum" | "polygon" | "arbitrum"

const timeFrameConfig = {
  "1m": { label: "1 Min", intervalMs: 1 * 60 * 1000 },
  "5m": { label: "5 Min", intervalMs: 5 * 60 * 1000 },
  "15m": { label: "15 Min", intervalMs: 15 * 60 * 1000 },
  "1h": { label: "1 Hour", intervalMs: 60 * 60 * 1000 },
  "4h": { label: "4 Hours", intervalMs: 4 * 60 * 60 * 1000 },
  "1d": { label: "1 Day", intervalMs: 24 * 60 * 60 * 1000 },
}

const networkConfig = {
  all: { label: "All Networks", color: "#ffffff" },
  ethereum: { label: "Ethereum", color: "#10b981" },
  polygon: { label: "Polygon", color: "#a855f7" },
  arbitrum: { label: "Arbitrum", color: "#06b6d4" },
}

export function GasChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<{
    ethereum?: ISeriesApi<"Candlestick">
    polygon?: ISeriesApi<"Candlestick">
    arbitrum?: ISeriesApi<"Candlestick">
  }>({})

  const [isChartVisible, setIsChartVisible] = useState(false)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("15m")
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkFilter>("ethereum") // Default to Ethereum
  const { chains } = useGasStore()

  useEffect(() => {
    if (!chartContainerRef.current || !isChartVisible) return

    // Create chart with #1A1B30 background
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "#1A1B30" },
        textColor: "#ffffff",
        fontSize: 12,
        fontFamily: "Domine, Georgia, serif",
      },
      grid: {
        vertLines: {
          color: "#404040",
          style: LineStyle.Dotted,
          visible: true,
        },
        horzLines: {
          color: "#404040",
          style: LineStyle.Dotted,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#ffffff",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "#ffffff",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: "#404040",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        visible: true,
        entireTextOnly: false,
      },
      timeScale: {
        borderColor: "#404040",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000)
          if (selectedTimeFrame === "1d") {
            return date.toLocaleDateString([], { month: "short", day: "numeric" })
          }
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        },
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 3,
      },
      watermark: {
        visible: true,
        fontSize: 24,
        horzAlign: "center",
        vertAlign: "center",
        color: "rgba(255, 255, 255, 0.1)",
        text: "Zeru Gas Tracker",
      },
    })

    chartRef.current = chart

    // Create series with colors optimized for dark background
    const ethereumSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#10b981",
      borderDownColor: "#10b981",
      borderUpColor: "#10b981",
      wickDownColor: "#10b981",
      wickUpColor: "#10b981",
      title: "Ethereum (ETH)",
      visible: selectedNetwork === "all" || selectedNetwork === "ethereum",
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${price.toFixed(1)} gwei`,
        minMove: 0.1,
      },
    })

    const polygonSeries = chart.addCandlestickSeries({
      upColor: "#a855f7",
      downColor: "#a855f7",
      borderDownColor: "#a855f7",
      borderUpColor: "#a855f7",
      wickDownColor: "#a855f7",
      wickUpColor: "#a855f7",
      title: "Polygon (MATIC)",
      visible: selectedNetwork === "all" || selectedNetwork === "polygon",
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${price.toFixed(1)} gwei`,
        minMove: 0.1,
      },
    })

    const arbitrumSeries = chart.addCandlestickSeries({
      upColor: "#06b6d4",
      downColor: "#06b6d4",
      borderDownColor: "#06b6d4",
      borderUpColor: "#06b6d4",
      wickDownColor: "#06b6d4",
      wickUpColor: "#06b6d4",
      title: "Arbitrum (ETH)",
      visible: selectedNetwork === "all" || selectedNetwork === "arbitrum",
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${price.toFixed(1)} gwei`,
        minMove: 0.1,
      },
    })

    seriesRef.current = {
      ethereum: ethereumSeries,
      polygon: polygonSeries,
      arbitrum: arbitrumSeries,
    }

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }, 100)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [isChartVisible, selectedTimeFrame, selectedNetwork])

  useEffect(() => {
    if (!seriesRef.current.ethereum || !seriesRef.current.polygon || !seriesRef.current.arbitrum || !isChartVisible)
      return

    // Convert gas history to candlestick data with configurable timeframe
    const convertToCandlestickData = (
      history: typeof chains.ethereum.history,
      chainName: string,
    ): CandlestickData<UTCTimestamp>[] => {
      if (history.length === 0) return []

      // Group data into selected timeframe intervals
      const intervals: { [key: number]: number[] } = {}
      const intervalMs = timeFrameConfig[selectedTimeFrame].intervalMs

      history.forEach((point) => {
        const intervalStart = Math.floor(point.timestamp / intervalMs) * intervalMs
        if (!intervals[intervalStart]) {
          intervals[intervalStart] = []
        }
        intervals[intervalStart].push(point.totalFee)
      })

      const candlestickData = Object.entries(intervals)
        .map(([timestamp, values]) => {
          const time = (Number.parseInt(timestamp) / 1000) as UTCTimestamp
          const open = values[0]
          const close = values[values.length - 1]
          const high = Math.max(...values)
          const low = Math.min(...values)

          return { time, open, high, low, close }
        })
        .sort((a, b) => a.time - b.time)

      console.log(`📊 ${chainName} chart data (${selectedTimeFrame}):`, {
        intervals: Object.keys(intervals).length,
        dataPoints: candlestickData.length,
        latestPrice: candlestickData[candlestickData.length - 1]?.close?.toFixed(1) + " gwei",
      })

      return candlestickData
    }

    // Update series data and visibility based on selected network
    try {
      const ethereumData = convertToCandlestickData(chains.ethereum.history, "Ethereum")
      const polygonData = convertToCandlestickData(chains.polygon.history, "Polygon")
      const arbitrumData = convertToCandlestickData(chains.arbitrum.history, "Arbitrum")

      // Update series visibility
      seriesRef.current.ethereum?.applyOptions({
        visible: selectedNetwork === "all" || selectedNetwork === "ethereum",
      })
      seriesRef.current.polygon?.applyOptions({
        visible: selectedNetwork === "all" || selectedNetwork === "polygon",
      })
      seriesRef.current.arbitrum?.applyOptions({
        visible: selectedNetwork === "all" || selectedNetwork === "arbitrum",
      })

      // Update data
      if (ethereumData.length > 0) {
        seriesRef.current.ethereum?.setData(ethereumData)
      }
      if (polygonData.length > 0) {
        seriesRef.current.polygon?.setData(polygonData)
      }
      if (arbitrumData.length > 0) {
        seriesRef.current.arbitrum?.setData(arbitrumData)
      }

      // Auto-fit the chart to show visible data with zoom
      if (chartRef.current) {
        // Small delay to ensure series visibility is updated
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()

            // Auto-zoom to visible data range for better view
            if (selectedNetwork !== "all") {
              const visibleData =
                selectedNetwork === "ethereum"
                  ? ethereumData
                  : selectedNetwork === "polygon"
                    ? polygonData
                    : selectedNetwork === "arbitrum"
                      ? arbitrumData
                      : []

              if (visibleData.length > 0) {
                // Get price range for the selected network
                const prices = visibleData.flatMap((d) => [d.high, d.low])
                const minPrice = Math.min(...prices)
                const maxPrice = Math.max(...prices)
                const padding = (maxPrice - minPrice) * 0.1 // 10% padding

                chartRef.current.priceScale("right").applyOptions({
                  scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                  },
                })
              }
            }
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error updating chart data:", error)
    }
  }, [chains, selectedTimeFrame, selectedNetwork, isChartVisible])

  const hasData =
    chains.ethereum.history.length > 0 || chains.polygon.history.length > 0 || chains.arbitrum.history.length > 0

  const handleViewChart = () => {
    setIsChartVisible(true)
  }

  const getVisibleNetworksCount = () => {
    if (selectedNetwork === "all") return 3
    return 1
  }

  const getCurrentNetworkData = () => {
    if (selectedNetwork === "ethereum") return chains.ethereum
    if (selectedNetwork === "polygon") return chains.polygon
    if (selectedNetwork === "arbitrum") return chains.arbitrum
    return null
  }

  return (
    <div className="relative w-full">
      {/* Chart Overlay - Blue cover with View Chart button */}
      {!isChartVisible && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "#1A1B30" }}
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-heading">Gas Price Volatility Chart</h3>
              <p className="text-white/80 max-w-md font-content">
                View real-time candlestick charts showing gas price movements across all networks with customizable
                timeframes and network filtering
              </p>
            </div>
            <Button
              onClick={handleViewChart}
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-3 font-content"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Chart
            </Button>
          </div>
        </div>
      )}

      {/* Controls - Only show when chart is visible */}
      {isChartVisible && (
        <div className="mb-4 space-y-3">
          {/* Network Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-black" />
              <span className="text-sm font-medium text-black font-content">Network:</span>
              <div className="flex items-center gap-1">
                {Object.entries(networkConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={selectedNetwork === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedNetwork(key as NetworkFilter)}
                    className={`text-xs px-3 py-1 h-8 flex items-center gap-1.5 font-content ${
                      selectedNetwork === key
                        ? "text-white hover:opacity-90"
                        : "border-gray-400 text-gray-700 bg-white hover:bg-gray-100"
                    }`}
                    style={selectedNetwork === key ? { backgroundColor: "#1A1B30" } : {}}
                  >
                    {key !== "all" && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    )}
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-600 font-content">
              Showing {getVisibleNetworksCount()} network{getVisibleNetworksCount() > 1 ? "s" : ""}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black" />
              <span className="text-sm font-medium text-black font-content">Timeframe:</span>
              <div className="flex items-center gap-1">
                {Object.entries(timeFrameConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={selectedTimeFrame === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeFrame(key as TimeFrame)}
                    className={`text-xs px-3 py-1 h-8 font-content ${
                      selectedTimeFrame === key
                        ? "text-white hover:opacity-90"
                        : "border-gray-400 text-gray-700 bg-white hover:bg-gray-100"
                    }`}
                    style={selectedTimeFrame === key ? { backgroundColor: "#1A1B30" } : {}}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-600 font-content">
              Updated every {timeFrameConfig[selectedTimeFrame].label.toLowerCase()}
            </div>
          </div>

          {/* Current Network Info - Show when single network is selected */}
          {selectedNetwork !== "all" && getCurrentNetworkData() && (
            <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: networkConfig[selectedNetwork].color }}
                />
                <span className="text-sm font-medium text-black font-content">
                  {networkConfig[selectedNetwork].label}
                </span>
                <span className="text-xs text-gray-600 font-content">
                  Current: {(getCurrentNetworkData()!.baseFee + getCurrentNetworkData()!.priorityFee).toFixed(1)} gwei
                </span>
              </div>
              <div className="text-xs text-gray-600 font-content">Auto-zoomed for optimal view</div>
            </div>
          )}
        </div>
      )}

      {/* Chart Container - Dark background */}
      <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg" />

      {/* Axis Labels - White text for dark background - Only show when chart is visible */}
      {isChartVisible && (
        <>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium font-content">
            Time ({timeFrameConfig[selectedTimeFrame].label} intervals)
          </div>
          <div
            className="absolute top-1/2 left-2 transform -translate-y-1/2 -rotate-90 text-xs text-white font-medium origin-center font-content"
            style={{ transformOrigin: "center" }}
          >
            Gas Price (gwei)
          </div>
        </>
      )}

      {/* Empty State - Dark theme - Only show when chart is visible but no data */}
      {isChartVisible && !hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-white font-heading">No Data Available</div>
              <div className="text-sm text-gray-300 max-w-xs font-content">
                Gas price data will appear as blocks are processed from the networks
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
