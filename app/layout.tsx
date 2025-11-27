import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trip Planner',
  description: 'Compare flight routes and plan your trip',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
