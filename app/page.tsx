"use client";

import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon, Sparkles, QrCode } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/backgrounds/home-bg2.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/80 to-black/50" />

        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center space-y-6 px-6 max-w-3xl mx-auto pt-20">
          {/* Main Title - Elegant Serif */}
          <h1
            className="font-[family-name:var(--font-cormorant)] text-5xl md:text-7xl font-light tracking-wide text-white animate-slide-down"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            {t.heroTitle}
          </h1>

          {/* Decorative Line */}
          <div
            className="w-20 h-0.5 mx-auto bg-gradient-to-r from-transparent via-beige-light to-transparent opacity-60 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          />

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/90 font-light tracking-wider max-w-xl mx-auto animate-fade-in"
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            {t.subtitle}
          </p>

          {/* CTA Button - Glassmorphism Style */}
          <div
            className="pt-4 animate-slide-up"
            style={{ animationDelay: '0.7s', animationFillMode: 'both' }}
          >
            <Link href="/dashboard">
              <button className="
                  px-10 py-4
                  bg-white/90 backdrop-blur-md
                  text-brown-dark font-medium
                  text-sm uppercase tracking-[0.15em]
                  rounded-full
                  border border-white/80
                  shadow-[0_10px_40px_rgba(0,0,0,0.25)]
                  transition-all duration-300
                  hover:bg-white hover:translate-y-[-3px] hover:shadow-[0_15px_50px_rgba(0,0,0,0.3)]
                  active:translate-y-[-1px]
                ">
                {t.createEvent}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-20 py-32 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-brown-dark font-medium uppercase tracking-wider">
            {t.featuresTitle}
          </h2>
          <div className="w-16 h-1 mx-auto bg-brown-dark/20 rounded-full" />
          <p className="text-lg text-brown-dark/70 font-light leading-relaxed">
            {t.featuresSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: Full Quality */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <ImageIcon className="w-6 h-6 text-brown-dark opacity-100" />
            </div>
            <h3 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium mb-3 text-brown-dark">
              {t.featureHighQualityTitle}
            </h3>
            <p className="text-brown-dark/70 font-light leading-relaxed">
              {t.featureHighQualityDesc}
            </p>
          </div>

          {/* Feature 2: Instant Access */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <QrCode className="w-6 h-6 text-brown-dark opacity-100" />
            </div>
            <h3 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium mb-3 text-brown-dark">
              {t.featureInstantAccessTitle}
            </h3>
            <p className="text-brown-dark/70 font-light leading-relaxed">
              {t.featureInstantAccessDesc}
            </p>
          </div>

          {/* Feature 3: Challenges */}
          <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-brown-dark opacity-100" />
            </div>
            <h3 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium mb-3 text-brown-dark">
              {t.featureChallengesTitle}
            </h3>
            <p className="text-brown-dark/70 font-light leading-relaxed">
              {t.featureChallengesDesc}
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}

