"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Camera, Check, Image } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useChallenges } from "@/hooks/useChallenges";
import { usePhotos } from "@/hooks/usePhotos";
import { useGuestIdentity } from "@/hooks/useGuestIdentity";
import Link from "next/link";

export default function GuestChallengesPage() {
    const { eventId } = useParams() as { eventId: string };
    const router = useRouter();
    const { t } = useLanguage();
    const { challenges } = useChallenges(eventId);
    const { photos } = usePhotos(eventId);
    const { identity } = useGuestIdentity(eventId);

    // Get photos submitted by this guest for each challenge
    const getGuestChallengePhotos = (challengeId: string) => {
        if (!identity?.guestId) return [];
        return photos.filter(p => p.challenge_id === challengeId && p.guest_id === identity.guestId);
    };

    if (challenges.length === 0) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <Link href={`/guest/${eventId}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {t.back}
                            </Button>
                        </Link>
                        <LanguageToggle />
                    </div>
                    <div className="text-center py-12">
                        <Sparkles className="w-16 h-16 mx-auto text-foreground/20 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No challenges yet</h2>
                        <p className="text-foreground/50">
                            The host hasn't created any photo challenges for this event.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href={`/guest/${eventId}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            {t.back}
                        </Button>
                    </Link>
                    <LanguageToggle />
                </div>

                {/* Title */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-4">
                        <Sparkles className="w-5 h-5 text-accent-end" />
                        <span className="font-medium text-accent-end">{t.challengesTitle}</span>
                    </div>
                    <p className="text-foreground/60 text-sm">
                        Complete these photo challenges and share your best shots!
                    </p>
                </div>

                {/* Challenges List */}
                <div className="space-y-4">
                    {challenges.map((challenge) => {
                        const guestPhotos = getGuestChallengePhotos(challenge.id);
                        const hasSubmitted = guestPhotos.length > 0;
                        const totalPhotos = photos.filter(p => p.challenge_id === challenge.id).length;

                        return (
                            <Card
                                key={challenge.id}
                                className={`
                                    relative overflow-hidden cursor-pointer transition-all
                                    hover:border-accent hover:shadow-lg
                                    ${hasSubmitted ? 'bg-green-50 border-green-200' : ''}
                                `}
                                onClick={() => router.push(`/guest/${eventId}/upload?challenge=${challenge.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Challenge Icon/Status */}
                                    <div className={`
                                        w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                                        ${hasSubmitted ? 'bg-green-500' : 'bg-accent/20'}
                                    `}>
                                        {hasSubmitted ? (
                                            <Check className="w-6 h-6 text-white" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-accent-end" />
                                        )}
                                    </div>

                                    {/* Challenge Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{challenge.title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-foreground/50 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Image className="w-3.5 h-3.5" />
                                                {totalPhotos} submitted
                                            </span>
                                            {hasSubmitted && (
                                                <span className="text-green-600 font-medium">
                                                    ✓ You submitted {guestPhotos.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="text-foreground/30">
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Back to Main */}
                <div className="text-center pt-4">
                    <Link href={`/guest/${eventId}/upload`}>
                        <Button variant="outline" size="sm">
                            Or upload without a challenge
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
