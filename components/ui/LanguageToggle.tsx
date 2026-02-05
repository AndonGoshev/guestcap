"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Button } from "./Button";
import { Globe } from "lucide-react";

export function LanguageToggle({ className = "" }: { className?: string }) {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'bg' ? 'en' : 'bg');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className={`gap-2 text-white hover:text-white/80 ${className}`}
            title={language === 'bg' ? 'Switch to English' : 'Превключи на Български'}
        >
            <Globe className="w-4 h-4 text-white" />
            <span className="font-medium text-white">{language === 'bg' ? 'EN' : 'БГ'}</span>
        </Button>
    );
}

