"use client";

import React from "react";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

export function LoadingScreen() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="absolute top-6 right-6 z-10">
                <LanguageToggle />
            </div>

            <div className="text-center animate-pulse">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gradient opacity-50" />
                <p className="text-foreground/50">{t.loading}</p>
            </div>
        </div>
    );
}
