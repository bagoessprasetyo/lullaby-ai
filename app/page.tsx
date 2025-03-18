"use client"
import { HeroHighlight } from "@/components/ui/hero-highlight";
import { Highlight } from "@/components/ui/hero-highlight";
import { motion } from "framer-motion";
import { BentoGrid, BentoItem} from "@/components/ui/bento-grid"
import {
    ImagePlus,
    Languages,
    Mic,
    Music,
    ScanFace,
    Sparkles,
    Mail, Phone, Linkedin,
} from "lucide-react";
import { MagnetizeButton } from "@/components/ui/magnetize-button";
import { PricingSection } from "@/components/pricing/pricing-section";
import AuthDebugComponent from "@/components/AuthDebugComponent";

export default function Home() {

  const itemsSample: BentoItem[] = [
    {
        title: "Multi-Image Stories",
        meta: "Up to 5 images",
        description: 
            "Create flowing narratives from multiple photos, weaving them into a cohesive bedtime story that brings your memories to life",
        icon: <ImagePlus className="w-4 h-4 text-blue-500" />,
        status: "Core",
        tags: ["Photos", "Stories", "AI"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "Voice Personalization",
        meta: "Custom narration",
        description: "Personalize stories with your own voice for a familiar and comforting experience",
        icon: <Mic className="w-4 h-4 text-emerald-500" />,
        status: "Featured",
        tags: ["Voice", "Custom"],
    },
    {
        title: "Multi-Language Support",
        meta: "4 languages",
        description: "Generate stories in English, Indonesian, Japanese, and French with natural language processing",
        icon: <Languages className="w-4 h-4 text-purple-500" />,
        tags: ["Languages", "Global"],
        colSpan: 2,
    },
    {
        title: "Soothing Music",
        meta: "Background tracks",
        description: "Gentle background music perfectly mixed with your narration for a calming bedtime atmosphere",
        icon: <Music className="w-4 h-4 text-sky-500" />,
        status: "Enhanced",
        tags: ["Audio", "Ambient"],
    },
    {
        title: "AI Story Generation",
        meta: "Unique stories",
        description: "Advanced AI that creates engaging, age-appropriate stories from your images with natural flow",
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        status: "Smart",
        tags: ["AI", "Creative"],
        colSpan: 2,
    },
    {
        title: "Scene Analysis",
        meta: "Smart detection",
        description: "Intelligent image analysis that captures details and emotions to enhance storytelling",
        icon: <ScanFace className="w-4 h-4 text-rose-500" />,
        status: "AI",
        tags: ["Vision", "Analysis"],
    }
];

  return (
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-2 row-start-2 items-center sm:items-start">
        <HeroHighlight>
          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: [20, -5, 0],
            }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center lg:text-left mx-auto mt-28 lg:mt-4"
          >
            Transform cherished moments into magical bedtime stories powered by {" "} 
            <Highlight className="text-black dark:text-white">
            Lullaby.ai
            </Highlight>
          </motion.h1>
        </HeroHighlight>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="mx-auto flex flex-col space-y-3 bg-black mt-52 lg:mt-4"
        >
          <MagnetizeButton particleCount={14}attractRadius={50} className="w-1/6 ml-4 mx-auto" />
          <AuthDebugComponent/>
          <BentoGrid items={itemsSample} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="mx-auto flex flex-col space-y-3 bg-black mt-52 lg:mt-4"
        >
          <PricingSection />
        </motion.div>
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full py-4 bg-gray-100 dark:bg-black text-center text-gray-700 dark:text-gray-300 mt-8"
        >
          <p className="text-sm mb-4">
            © 2025 Lullaby-AI. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 text-xs">
            <motion.a
              href="mailto:prasetyobagus7@gmail.com"
              whileHover={{ scale: 1.1 }}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-500"
            >
              <Mail className="w-5 h-5" />
              <span>Email</span>
            </motion.a>
            <motion.a
              href="tel:+6281291690707"
              whileHover={{ scale: 1.1 }}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-green-500"
            >
              <Phone className="w-5 h-5" />
              <span>Phone</span>
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/bagus-prasetyo-96a506113/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-700"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </motion.a>
          </div>
        </motion.footer>
      </main>
    // </div>
  );
}
