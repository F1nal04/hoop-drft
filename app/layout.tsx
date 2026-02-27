import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'HoopDrft',
  description: 'HoopDrft - head-to-head fantasy NBA draft with a 2-minute timer and snake format',
}

export const viewport: Viewport = {
  themeColor: '#111318',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_oswald.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
