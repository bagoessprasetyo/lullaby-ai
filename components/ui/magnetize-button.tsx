"use client" 

import * as React from "react"
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { Magnet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
}

export function MagnetizeButton({
    className,
    particleCount = 12,
    attractRadius = 50,
    ...props
}: MagnetizeButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAttracting, setIsAttracting] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }));
        setParticles(newParticles);
    }, [particleCount]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10,
            },
        });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        }));
    }, [particlesControl, particles]);

    const handleButtonClick = () => {
        if (status === "authenticated" && session) {
            // User is already logged in, redirect to dashboard
            router.push("/dashboard");
        } else {
            // User is not logged in, open auth modal
            setIsAuthModalOpen(true);
        }
    };

    return (
        <>
            <Button
                className={cn(
                    "min-w-40 relative touch-none",
                    "bg-violet-100 dark:bg-violet-900",
                    "hover:bg-violet-200 dark:hover:bg-violet-800",
                    "text-violet-600 dark:text-violet-300",
                    "border border-violet-300 dark:border-violet-700",
                    "transition-all duration-300",
                    className
                )}
                onMouseEnter={handleInteractionStart}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onClick={handleButtonClick}
                {...props}
            >
                {particles.map((_, index) => (
                    <motion.div
                        key={index}
                        custom={index}
                        initial={{ x: particles[index].x, y: particles[index].y }}
                        animate={particlesControl}
                        className={cn(
                            "absolute w-1.5 h-1.5 rounded-full",
                            "bg-violet-400 dark:bg-violet-300",
                            "transition-opacity duration-300",
                            isAttracting ? "opacity-100" : "opacity-40"
                        )}
                    />
                ))}
                <span className="relative w-full flex items-center justify-center gap-2">
                    <Magnet
                        className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            isAttracting && "scale-110"
                        )}
                    />
                    {status === "authenticated" ? "Go to Dashboard" : "Begin the Magic"}
                </span>
            </Button>

            <AuthModal 
                isOpen={isAuthModalOpen}
                onOpenChange={setIsAuthModalOpen}
            />
        </>
    );
}