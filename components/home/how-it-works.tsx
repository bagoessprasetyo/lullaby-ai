"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Upload, Settings, BookOpen, Music } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <Upload size={24} className="text-primary" />,
      title: "Upload Photos",
      description: "Upload family photos to start creating your story.",
    },
    {
      icon: <Settings size={24} className="text-primary" />,
      title: "Customize Settings",
      description: "Choose characters, themes, and languages.",
    },
    {
      icon: <BookOpen size={24} className="text-primary" />,
      title: "Generate Story",
      description: "AI creates a personalized bedtime story.",
    },
    {
      icon: <Music size={24} className="text-primary" />,
      title: "Listen & Enjoy",
      description: "Listen to the narrated story with music.",
    },
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4">{step.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 