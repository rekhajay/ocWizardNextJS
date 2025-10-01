import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OC Renewal Wizard',
  description: 'OC Renewal Wizard - Static React Preview',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}
