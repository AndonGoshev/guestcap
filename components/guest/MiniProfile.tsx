"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Folder, Camera, Star, Users, Image, ArrowLeft } from "lucide-react";
import { ActionCard } from "./ActionCard";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface MiniProfileProps {
    guestName: string;
    uploadCount: number;
    eventName: string;
    eventStats: {
        totalPhotos: number;
        totalGuests: number;
    };
    challengeCount: number;
    isReturningGuest?: boolean;
    onLogout?: () => void;
}

export function MiniProfile({
    guestName,
    uploadCount,
    eventName,
    eventStats,
    challengeCount,
    isReturningGuest = false,
    onLogout,
}: MiniProfileProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const { eventId } = useParams() as { eventId: string };

    const getGreeting = () => {
        if (isReturningGuest) {
            return `Welcome back, ${guestName}! 👋`;
        }
        if (uploadCount === 0) {
            return `Hi ${guestName}! Ready to capture memories?`;
        }
        if (uploadCount < 5) {
            return `Great start, ${guestName}!`;
        }
        return `You're on fire, ${guestName}! 🔥`;
    };

    const getUploadMessage = () => {
        if (uploadCount === 0) {
            return "Start sharing your memories";
        }
        return `You've shared ${uploadCount} ${uploadCount === 1 ? "memory" : "memories"}`;
    };

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {t.back}
                    </Button>
                </Link>
                <LanguageToggle />
            </div>

            <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Event Name */}
                <div className="text-center">
                    <p className="text-sm text-foreground/50 uppercase tracking-wide mb-1">
                        {eventName}
                    </p>
                </div>

                {/* Greeting */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{getGreeting()}</h1>
                    <p className="text-foreground/60">{getUploadMessage()}</p>
                </div>

                {/* Action Cards */}
                <div className="space-y-3">
                    <ActionCard
                        icon={<Folder className="w-6 h-6" />}
                        title="Send photos from phone"
                        subtitle="Upload from your gallery"
                        onClick={() => router.push(`/guest/${eventId}/upload`)}
                    />

                    <ActionCard
                        icon={<Camera className="w-6 h-6" />}
                        title="Take photos now"
                        subtitle="Open camera"
                        onClick={() => router.push(`/guest/${eventId}/camera`)}
                    />

                    <ActionCard
                        icon={<Star className="w-6 h-6" />}
                        title={t.challengesTitle}
                        subtitle="Complete fun photo tasks"
                        onClick={() => router.push(`/guest/${eventId}/challenges`)}
                        highlighted
                        badge={challengeCount > 0 ? challengeCount : undefined}
                    />
                </div>

                {/* Event Stats */}
                <div className="flex items-center justify-center gap-4 text-sm text-foreground/50 pt-4">
                    <div className="flex items-center gap-1.5">
                        <Image className="w-4 h-4" />
                        <span>{eventStats.totalPhotos} {t.photos}</span>
                    </div>
                    <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{eventStats.totalGuests} {t.guests}</span>
                    </div>
                </div>

                {/* Change identity option */}
                {onLogout && (
                    <div className="text-center pt-4">
                        <button
                            onClick={onLogout}
                            className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
                        >
                            Not {guestName}? Use a different name
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
