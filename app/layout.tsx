import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { UpgradeModalProvider } from "@/components/upgrade-modal-providers";
import { Analytics } from "@vercel/analytics/react"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} dark bg-black antialiased`}
      >
        <UpgradeModalProvider>
          <AuthProvider>
            {children}
            <Analytics/>
          </AuthProvider>
        </UpgradeModalProvider>
      </body>
    </html>
  );
}
