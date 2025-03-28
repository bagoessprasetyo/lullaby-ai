// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import { SpeedInsights } from "@vercel/speed-insights/next"
// import { Analytics } from '@upstash/ratelimit';
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
            <Toaster />
            <Analytics />
            <SpeedInsights/>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}