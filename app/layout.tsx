import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Zeru Gas Tracker",
  description: "Real-time cross-chain gas price tracking across Ethereum, Polygon, and Arbitrum",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/fonts/Bungee-Regular.ttf" as="font" type="font/truetype" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Domine-Regular.ttf" as="font" type="font/truetype" crossOrigin="anonymous" />
      </head>
      <body className="theme-light font-content">{children}</body>
    </html>
  )
}
