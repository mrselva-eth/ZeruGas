"use client"

import { useEffect, useRef } from "react"
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

export function GasChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<{
    ethereum?: ISeriesApi<"Candlestick">
    polygon?: ISeriesApi<"Candlestick">
    arbitrum?: ISeriesApi<"Candlestick">
  }>({})

  const { chains } = useGasStore()

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart with #1A1B30 background
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "#1A1B30" },
        textColor: "#ffffff",
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
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
  }, [])

  useEffect(() => {
    if (!seriesRef.current.ethereum || !seriesRef.current.polygon || !seriesRef.current.arbitrum) return

    // Convert gas history to candlestick data with proper aggregation
    const convertToCandlestickData = (
      history: typeof chains.ethereum.history,
      chainName: string,
    ): CandlestickData<UTCTimestamp>[] => {
      if (history.length === 0) return []

      // Group data into 15-minute intervals
      const intervals: { [key: number]: number[] } = {}
      const INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

      history.forEach((point) => {
        const intervalStart = Math.floor(point.timestamp / INTERVAL_MS) * INTERVAL_MS
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

      console.log(`📊 ${chainName} chart data:`, {
        intervals: Object.keys(intervals).length,
        dataPoints: candlestickData.length,
        latestPrice: candlestickData[candlestickData.length - 1]?.close?.toFixed(1) + " gwei",
      })

      return candlestickData
    }

    // Update series data with error handling
    try {
      const ethereumData = convertToCandlestickData(chains.ethereum.history, "Ethereum")
      const polygonData = convertToCandlestickData(chains.polygon.history, "Polygon")
      const arbitrumData = convertToCandlestickData(chains.arbitrum.history, "Arbitrum")

      if (ethereumData.length > 0) {
        seriesRef.current.ethereum?.setData(ethereumData)
      }
      if (polygonData.length > 0) {
        seriesRef.current.polygon?.setData(polygonData)
      }
      if (arbitrumData.length > 0) {
        seriesRef.current.arbitrum?.setData(arbitrumData)
      }

      // Auto-fit the chart to show all data
      if (chartRef.current && (ethereumData.length > 0 || polygonData.length > 0 || arbitrumData.length > 0)) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (error) {
      console.error("Error updating chart data:", error)
    }
  }, [chains])

  const hasData =
    chains.ethereum.history.length > 0 || chains.polygon.history.length > 0 || chains.arbitrum.history.length > 0

  return (
    <div className="relative w-full">
      {/* Chart Container - Dark background */}
      <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg" />

      {/* Axis Labels - White text for dark background */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium">
        Time (15-minute intervals)
      </div>
      <div
        className="absolute top-1/2 left-2 transform -translate-y-1/2 -rotate-90 text-xs text-white font-medium origin-center"
        style={{ transformOrigin: "center" }}
      >
        Gas Price (gwei)
      </div>

      {/* Empty State - Dark theme */}
      {!hasData && (
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
              <div className="text-lg font-semibold text-white">No Data Available</div>
              <div className="text-sm text-gray-300 max-w-xs">
                Gas price data will appear as blocks are processed from the networks
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
