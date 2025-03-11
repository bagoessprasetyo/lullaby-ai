import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { UpgradeModalProvider } from "@/components/upgrade-modal-providers";
import { Analytics } from "@vercel/analytics/react"

// Use Inter as a fallback font that works reliably with Next.js
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lullaby AI - Bedtime Stories from Your Photos",
  description: "Transform cherished moments into magical bedtime stories powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} dark bg-black antialiased`}
      >
        <UpgradeModalProvider>
          <AuthProvider>
            {children}
            {/* <Analytics/> */}
          </AuthProvider>
        </UpgradeModalProvider>
      </body>
    </html>
  );
}
