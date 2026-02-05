"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Camera } from "lucide-react";

interface NameInputProps {
    eventName: string;
    onSubmit: (name: string) => Promise<void>;
    isLoading?: boolean;
}

export function NameInput({ eventName, onSubmit, isLoading = false }: NameInputProps) {
    const { t } = useLanguage();
    const [name, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isLoading) return;
        await onSubmit(name.trim());
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
            <div className="absolute top-6 right-6 z-10">
                <LanguageToggle />
            </div>

            <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-accent-gradient rounded-full flex items-center justify-center shadow-lg">
                        <Camera className="w-10 h-10 text-foreground" />
                    </div>
                </div>

                {/* Event Name */}
                <div className="space-y-2">
                    <p className="text-sm text-foreground/50 uppercase tracking-wide">
                        {t.welcome}
                    </p>
                    <h1 className="text-3xl font-bold">{eventName}</h1>
                    <p className="text-foreground/60">{t.enterName}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder={t.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-center text-lg h-14"
                        autoFocus
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="h-14 text-lg"
                        variant="primary"
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? t.joining : t.continue}
                    </Button>
                </form>
            </div>
        </div>
    );
}
