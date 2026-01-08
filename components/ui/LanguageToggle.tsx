"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Button } from "./Button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'bg' ? 'en' : 'bg');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
            title={language === 'bg' ? 'Switch to English' : 'Превключи на Български'}
        >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{language === 'bg' ? 'EN' : 'БГ'}</span>
        </Button>
    );
}

