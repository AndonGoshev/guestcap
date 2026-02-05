"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-brown-dark font-medium uppercase tracking-wider">
                        {t.pricing}
                    </h1>
                    <div className="w-16 h-1 mx-auto bg-brown-dark/20 rounded-full" />
                    <p className="text-xl text-brown-dark/70 font-light italic">
                        Under development
                    </p>
                </div>

                <div className="pt-8">
                    <Link href="/">
                        <Button variant="ghost" className="text-brown-dark hover:bg-brown-dark/5">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.back}
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
