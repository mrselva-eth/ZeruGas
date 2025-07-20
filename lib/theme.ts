// Centralized theme configuration
// Light theme with #e9e9e9 background

export const theme = {
  // Primary colors
  primary: "#1A1B30", // Keep the primary color
  background: "#e9e9e9", // Light background

  // Derived colors for light theme
  colors: {
    // Backgrounds
    background: "#e9e9e9",
    surface: "#ffffff",
    surfaceHover: "#f5f5f5",

    // Text colors
    textPrimary: "#000000",
    textSecondary: "#737373",
    textMuted: "#a3a3a3",

    // Primary color variations
    primary: "#1A1B30",
    primaryHover: "#151629",
    primaryLight: "#2A2B40",

    // Borders and dividers
    border: "#c8c8c8",
    borderLight: "#e0e0e0",

    // Status colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",

    // Chart network colors (optimized for light theme)
    ethereum: "#10b981", // Green for Ethereum
    polygon: "#a855f7", // Purple for Polygon
    arbitrum: "#06b6d4", // Cyan for Arbitrum

    // Card and component backgrounds
    card: "#ffffff",
    cardHover: "#f9f9f9",

    // Input and form elements
    input: "#ffffff",
    inputBorder: "#c8c8c8",
    inputFocus: "#1A1B30",
  },
} as const

// CSS custom properties for easy integration
export const cssVariables = {
  "--theme-primary": theme.colors.primary,
  "--theme-background": theme.colors.background,
  "--theme-surface": theme.colors.surface,
  "--theme-surface-hover": theme.colors.surfaceHover,
  "--theme-text-primary": theme.colors.textPrimary,
  "--theme-text-secondary": theme.colors.textSecondary,
  "--theme-text-muted": theme.colors.textMuted,
  "--theme-border": theme.colors.border,
  "--theme-border-light": theme.colors.borderLight,
  "--theme-card": theme.colors.card,
  "--theme-card-hover": theme.colors.cardHover,
  "--theme-input": theme.colors.input,
  "--theme-input-border": theme.colors.inputBorder,
  "--theme-ethereum": theme.colors.ethereum,
  "--theme-polygon": theme.colors.polygon,
  "--theme-arbitrum": theme.colors.arbitrum,
} as const

// Utility function to apply theme
export const applyTheme = () => {
  if (typeof document !== "undefined") {
    const root = document.documentElement
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }
}
