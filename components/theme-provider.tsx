"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { applyTheme } from "@/lib/theme"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  forcedTheme?: string
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Apply custom theme on mount
    applyTheme()
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
