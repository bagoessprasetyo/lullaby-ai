// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/lib/providers/query-provider";
// import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lullaby.ai - Personalized Bedtime Stories',
  description: 'Create personalized bedtime stories for your children with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter} dark bg-black antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            {children}
            {/* <Toaster /> */}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}