"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface HomepageProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  announcementText?: string;
  announcementLink?: string;
}

export function Homepage({
  title = "Build better products with AI",
  subtitle = "Our platform helps you create, optimize, and deploy AI-powered solutions for your business needs.",
  ctaText = "Get Started",
  ctaLink = "#",
  announcementText = "New: AI-powered analytics now available",
  announcementLink = "#",
}: HomepageProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background to-background/95 px-4 py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 mb-8"
      >
        <a
          href={announcementLink}
          className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/15 hover:shadow-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <Sparkles size={14} className="text-primary" />
          </span>
          {announcementText}
          <ArrowRight size={14} className="ml-1 text-primary" />
        </a>
      </motion.div>

      <div className="z-10 flex max-w-3xl flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 max-w-2xl text-lg text-muted-foreground"
        >
          {subtitle}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href={ctaLink}
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="relative flex items-center gap-2">
              {ctaText}
              <ArrowRight 
                size={16} 
                className="transition-transform group-hover:translate-x-1" 
              />
            </span>
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 z-0 h-[400px] bg-gradient-radial from-primary/5 to-transparent"
      />
    </div>
  );
} 