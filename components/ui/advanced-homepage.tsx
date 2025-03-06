import React from "react";
import { motion } from "framer-motion";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Sparkles, Mic, Languages, Music, Library, User } from "lucide-react";
import { HeroSection } from "./hero-section";
import { Features } from "./features";

const AdvancedHomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800">
      {/* Hero Section */}
      <HeroSection
        title="Transform Your Memories into Magical Bedtime Stories"
        subtitle={{
          regular: "Lullaby.ai turns your cherished photos into ",
          gradient: "personalized bedtime stories.",
        }}
        description="With AI-generated narration and soothing music, create stories that captivate."
        ctaText="Start Your Story"
        ctaHref="#"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#"
        bottomImage={{
          light: "https://www.launchuicomponents.com/app-light.png",
          dark: "https://www.launchuicomponents.com/app-dark.png",
          alt: "Platform Dashboard",
        }}
        badge={{
          text: "New Features",
          href: "#",
        }}
      />

      {/* Features Section */}
      <Features
        badge="Core Features"
        title="Discover the magic of Lullaby.ai"
        description="Explore the features that make Lullaby.ai unique and engaging."
        features={[
          {
            icon: <Sparkles className="h-5 w-5" />,
            title: "AI-Generated Stories",
            description: "Create personalized bedtime stories from your photos with AI."
          },
          {
            icon: <Mic className="h-5 w-5" />,
            title: "Voice Narration",
            description: "Choose from a variety of AI voices or use your own."
          },
          {
            icon: <Languages className="h-5 w-5" />,
            title: "Multi-Language Support",
            description: "Generate stories in multiple languages including English, French, Japanese, and Indonesian."
          },
          {
            icon: <Music className="h-5 w-5" />,
            title: "Background Music",
            description: "Enhance your stories with soothing background music."
          },
          {
            icon: <Library className="h-5 w-5" />,
            title: "Media Library Management",
            description: "Organize and browse your stories with ease."
          },
          {
            icon: <User className="h-5 w-5" />,
            title: "Customizable Characters",
            description: "Personalize your stories with custom characters and themes."
          }
        ]}
        advantages={[
          {
            text: "Easy to customize",
            description: "Tailor components to match your brand and requirements."
          },
          {
            text: "Accessible by default",
            description: "Built with accessibility in mind for all users."
          },
          {
            text: "Well documented",
            description: "Comprehensive documentation to help you get started quickly."
          },
          {
            text: "Regular updates",
            description: "Continuous improvements and new features added regularly."
          }
        ]}
      />

      {/* FAQ Section */}
      <section className="py-20 bg-violet-50 dark:bg-violet-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-violet-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-violet-600 dark:text-violet-300">
              Find answers to common questions about Lullaby.ai
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "How does Lullaby.ai create stories?",
                answer: "Lullaby.ai uses AI to analyze your photos and generate personalized bedtime stories."
              },
              {
                question: "Can I use my own voice for narration?",
                answer: "Yes, you can create custom voice profiles using your own recordings."
              },
              {
                question: "What languages are supported?",
                answer: "Lullaby.ai supports English, French, Japanese, and Indonesian."
              },
              {
                question: "Is there a free version available?",
                answer: "Yes, Lullaby.ai offers a free tier with basic features."
              },
              {
                question: "How can I manage my stories?",
                answer: "You can organize, browse, and favorite your stories in the media library."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="mb-4"
              >
                <div className="border-b border-violet-200 dark:border-violet-700">
                  <button 
                    className="flex w-full items-center justify-between py-4 text-left font-medium text-violet-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-700 focus:ring-offset-2 transition-[color,box-shadow]"
                  >
                    <span>{faq.question}</span>
                    <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="pb-4 pt-0">
                    <p className="text-violet-600 dark:text-violet-300">{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-violet-600 dark:bg-violet-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mt-4 text-lg text-violet-100">
                  Join thousands of developers building amazing web experiences.
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <div className="inline-flex rounded-md shadow">
                  <button 
                    className="h-12 px-6 py-3 bg-white hover:bg-violet-50 text-violet-600 rounded-md font-medium shadow-sm hover:shadow transition-[color,box-shadow] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-violet-600"
                  >
                    Get Started
                  </button>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <button 
                    className="h-12 px-6 py-3 bg-violet-700 hover:bg-violet-800 text-white rounded-md font-medium border border-violet-500 shadow-sm hover:shadow transition-[color,box-shadow] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-violet-600"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Footer */}
      <footer className="bg-white dark:bg-violet-800 border-t border-violet-200 dark:border-violet-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-violet-500 dark:text-violet-300 uppercase tracking-wider">
                Product
              </h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Releases</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-violet-500 dark:text-violet-300 uppercase tracking-wider">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-violet-500 dark:text-violet-300 uppercase tracking-wider">
                Resources
              </h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-violet-500 dark:text-violet-300 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-base text-violet-600 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdvancedHomePage; 