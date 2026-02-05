"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

interface EventInactiveProps {
    eventName?: string;
}

export function EventInactive({ eventName }: EventInactiveProps) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="absolute top-6 right-6 z-10">
                <LanguageToggle />
            </div>

            <div className="text-center max-w-sm animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>

                <h1 className="text-2xl font-bold mb-3">
                    Event Inactive
                </h1>

                {eventName && (
                    <p className="text-lg text-foreground/70 mb-2">
                        {eventName}
                    </p>
                )}

                <p className="text-foreground/60">
                    This event is currently inactive. Please contact the host for more information.
                </p>
            </div>
        </div>
    );
}
