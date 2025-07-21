"use client"

import { useGasStore } from "@/lib/store/gas-store"
import { Button } from "@/components/ui/button"
import { Activity, Calculator } from "lucide-react"

export function ModeToggle() {
  const { mode, setMode } = useGasStore()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={mode === "live" ? "default" : "outline"}
        size="sm"
        onClick={() => setMode("live")}
        className={`flex items-center gap-2 transition-all duration-200 font-content ${
          mode === "live" ? "text-white hover:opacity-90" : "border-gray-400 text-gray-700 bg-white hover:bg-gray-100"
        }`}
        style={mode === "live" ? { backgroundColor: "#1A1B30" } : {}}
      >
        <Activity className="h-4 w-4" />
        Live Mode
      </Button>
      <Button
        variant={mode === "simulation" ? "default" : "outline"}
        size="sm"
        onClick={() => setMode("simulation")}
        className={`flex items-center gap-2 transition-all duration-200 font-content ${
          mode === "simulation"
            ? "text-white hover:opacity-90"
            : "border-gray-400 text-gray-700 bg-white hover:bg-gray-100"
        }`}
        style={mode === "simulation" ? { backgroundColor: "#1A1B30" } : {}}
      >
        <Calculator className="h-4 w-4" />
        Simulation
      </Button>
    </div>
  )
}
