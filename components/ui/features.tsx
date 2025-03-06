"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  hoverEffect?: "parallax" | "scale";
}

interface Advantage {
  text: string;
  description: string;
}

interface FeaturesProps {
  badge: string;
  title: string;
  description: string;
  features: Feature[];
  advantages: Advantage[];
  className?: string;
}

export function Features({ badge, title, description, features, advantages, className }: FeaturesProps) {
  return (
    <section className={cn("py-20 relative", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium">
              {badge}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} index={index} {...feature} />
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-violet-900 dark:text-white mb-8">
            Advantages
          </h3>
          <ul className="space-y-4">
            {advantages.map((advantage, index) => (
              <li key={index} className="text-lg text-violet-600 dark:text-violet-300">
                <strong>{advantage.text}:</strong> {advantage.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description, index }: Feature & { index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1 }}
      className="group relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100/20"
    >
      <div className="relative z-30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-100/30 dark:bg-blue-900/20 backdrop-blur-sm">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {title}
          </h3>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Interactive background */}
      <motion.div
        className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(99,102,241,0.1) 0%, transparent 80%)`,
        }}
      />

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: useMotionTemplate`conic-gradient(from 230.29deg at 51.63% 52.16%, 
            rgba(99,102,241,0.3) 0deg, 
            rgba(99,102,241,0.1) 67.5deg, 
            rgba(99,102,241,0.3) 198.75deg, 
            rgba(99,102,241,0.2) 251.25deg, 
            rgba(99,102,241,0.1) 301.88deg)`,
        }}
        animate={{ rotate: [0, 360] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.div>
  );
}

export default Features; 