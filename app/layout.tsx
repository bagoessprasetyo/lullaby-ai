// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Toaster = dynamic(
  () => import('sonner').then((mod) => mod.Toaster),
  { 
    ssr: false,
    loading: () => null
  }
);

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
      <body className={`${inter} dark bg-black antialiased`}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
          <AuthProvider>
            <QueryProvider>
              {children}
              <Analytics />
              <SpeedInsights/>
            </QueryProvider>
          </AuthProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  )
}