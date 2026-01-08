"use client";

import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-6">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white">
          GuestCap
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto">
          {t.subtitle}
        </p>
        <Link href="/dashboard">
          <Button variant="primary" size="lg" className="mt-4">
            {t.createEvent}
          </Button>
        </Link>
      </div>
    </div>
  );
}
