import type React from "react"
import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Aptos Compute | Decentralized GPU Marketplace",
  description:
    "Access a global network of GPU providers for AI, ML, and compute workloads. Powered by Aptos blockchain.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
