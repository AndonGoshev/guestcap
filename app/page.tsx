"use client";

import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/backgrounds/home-bg.jpg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-6 px-6 max-w-3xl mx-auto">
        {/* Main Title - Elegant Serif */}
        <h1
          className="font-[family-name:var(--font-cormorant)] text-6xl md:text-8xl font-light tracking-wide text-white animate-slide-down"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          GuestCap
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

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent z-5" />
    </div>
  );
}

