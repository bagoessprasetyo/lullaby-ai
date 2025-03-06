import React from "react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  title: string;
  subtitle: {
    regular: string;
    gradient: string;
  };
  description: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  bottomImage: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: {
    text: string;
    href: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  bottomImage,
  badge,
}) => {
  return (
    <section className="relative py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {subtitle.regular}
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500 bg-clip-text text-transparent">
              {subtitle.gradient}
            </span>
          </p>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {description}
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {ctaText}
            </a>
            <a
              href={secondaryCtaHref}
              className="ml-3 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              {secondaryCtaText}
            </a>
          </div>
        </div>
        <div className="mt-10">
          <img
            src={bottomImage.light}
            alt={bottomImage.alt}
            className="mx-auto"
          />
        </div>
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <a
            href={badge.href}
            className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
          >
            {badge.text}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 