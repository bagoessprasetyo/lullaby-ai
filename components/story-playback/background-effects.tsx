// components/story-playback/background-effects.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BackgroundTheme = "default" | "adventure" | "fantasy" | "night" | "school";

interface BackgroundEffectsProps {
  theme: BackgroundTheme;
  intensity?: number; // 0-100
  className?: string;
}

export function BackgroundEffects({ 
  theme = "default", 
  intensity = 50,
  className 
}: BackgroundEffectsProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse movement for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) - 0.5;
      const y = ((e.clientY - rect.top) / rect.height) - 0.5;
      
      setMousePosition({ x, y });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  
  // Get theme-specific elements
  const renderThemeElements = () => {
    const parallaxIntensity = intensity / 500; // Convert intensity to a usable value
    
    switch (theme) {
      case "adventure":
        return (
          <>
            {/* Mountainous background with clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 opacity-70"></div>
            
            {/* Mountains - parallax on mouse move */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-contain bg-bottom bg-no-repeat"
              style={{ 
                backgroundImage: "url('/backgrounds/mountains-silhouette.svg')",
                translateX: mousePosition.x * -20 * parallaxIntensity
              }}
            />
            
            {/* Clouds */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`cloud-${i}`}
                  className="absolute rounded-full bg-white opacity-20 blur-xl"
                  style={{
                    top: `${10 + Math.random() * 30}%`,
                    left: `${-20 + Math.random() * 140}%`,
                    width: `${100 + Math.random() * 200}px`,
                    height: `${50 + Math.random() * 100}px`,
                  }}
                  animate={{
                    left: ["0%", "100%"],
                    translateX: mousePosition.x * -10 * parallaxIntensity,
                    translateY: mousePosition.y * -10 * parallaxIntensity,
                  }}
                  transition={{
                    duration: 120 + Math.random() * 120,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                    delay: i * 5,
                  }}
                />
              ))}
            </div>
            
            {/* Subtle light rays */}
            <div className="absolute inset-0 bg-gradient-radial from-yellow-500/10 to-transparent opacity-50"></div>
          </>
        );
        
      case "fantasy":
        return (
          <>
            {/* Magical background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 opacity-80"></div>
            
            {/* Enchanted forest silhouette */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1/3 bg-contain bg-bottom bg-no-repeat"
              style={{ 
                backgroundImage: "url('/backgrounds/fantasy-forest.svg')",
                translateX: mousePosition.x * -15 * parallaxIntensity,
                translateY: mousePosition.y * 5 * parallaxIntensity
              }}
            />
            
            {/* Magical particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`,
                    opacity: 0.4 + Math.random() * 0.6,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 6,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
            
            {/* Magical glow */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent opacity-70"></div>
          </>
        );
        
      case "night":
        return (
          <>
            {/* Night sky background */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-blue-950 to-purple-950 opacity-90"></div>
            
            {/* Stars */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    top: `${Math.random() * 80}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${1 + Math.random() * 2}px`,
                    height: `${1 + Math.random() * 2}px`,
                  }}
                  animate={{
                    opacity: [0.2, 0.8, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            
            {/* Moon with parallax */}
            <motion.div
              className="absolute rounded-full bg-gradient-to-br from-gray-100 to-gray-300 opacity-80 blur-[1px]"
              style={{
                top: "15%",
                right: "15%",
                width: "60px",
                height: "60px",
                boxShadow: "0 0 20px 5px rgba(255, 255, 255, 0.3)",
                translateX: mousePosition.x * -10 * parallaxIntensity,
                translateY: mousePosition.y * -10 * parallaxIntensity,
              }}
            />
            
            {/* Window frame suggestion */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] pointer-events-none"></div>
          </>
        );
        
      case "school":
        return (
          <>
            {/* Colorful learning background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-blue-50 opacity-95"></div>
            
            {/* Floating education symbols */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              {["📚", "🔍", "🔬", "🌍", "✏️", "📝", "🧮", "📊", "🧠"].map((symbol, i) => (
                <motion.div
                  key={`symbol-${i}`}
                  className="absolute text-3xl"
                  style={{
                    top: `${Math.random() * 80}%`,
                    left: `${Math.random() * 80}%`,
                    rotate: `${Math.random() * 30 - 15}deg`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [`${Math.random() * 30 - 15}deg`, `${Math.random() * 30 - 15}deg`],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                >
                  {symbol}
                </motion.div>
              ))}
            </div>
            
            {/* Light pattern overlay */}
            <div className="absolute inset-0 bg-[url('/backgrounds/grid-pattern.svg')] bg-repeat opacity-10"></div>
            
            {/* Vignette effect */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] pointer-events-none"></div>
          </>
        );
        
      default:
        return (
          <>
            {/* Default subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
            
            {/* Subtle animated grain effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[url('/backgrounds/noise.svg')] animate-grain"></div>
            </div>
            
            {/* Gentle vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]"></div>
          </>
        );
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      {renderThemeElements()}
      
      {/* Overlay to control intensity - more opacity = less intense effects */}
      <div 
        className="absolute inset-0 bg-black transition-opacity duration-500" 
        style={{ opacity: 1 - (intensity / 100) }}
      />
    </div>
  );
}