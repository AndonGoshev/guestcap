"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UploadSuccessProps {
    uploadCount: number;
    onDone: () => void;
    eventName?: string;
}

const CELEBRATION_EMOJIS = ["🎉", "✨", "🌟", "💫", "🎊", "🔥", "💖"];

export function UploadSuccess({ uploadCount, onDone, eventName }: UploadSuccessProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [emoji, setEmoji] = useState("✨");

    useEffect(() => {
        // Random emoji
        setEmoji(CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]);

        // Trigger confetti animation
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const getMessage = () => {
        if (uploadCount === 1) {
            return "Your first photo is live!";
        }
        if (uploadCount < 5) {
            return `${uploadCount} photos uploaded successfully!`;
        }
        if (uploadCount < 10) {
            return `Amazing! ${uploadCount} memories shared! 🔥`;
        }
        return `Incredible! ${uploadCount} photos! You're a superstar! ⭐`;
    };

    return (
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            {/* Animated success icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                    className={`
                        absolute inset-0 rounded-full bg-green-100
                        ${showConfetti ? "animate-ping" : ""}
                    `}
                />
                <div className="absolute inset-0 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                {/* Floating emoji */}
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                    {emoji}
                </div>
            </div>

            {/* Success message */}
            <h2 className="text-2xl font-bold mb-2 text-green-600">
                {getMessage()}
            </h2>

            {eventName && (
                <p className="text-foreground/60 mb-6">
                    Your photos are now part of {eventName}
                </p>
            )}

            {/* Emotional feedback */}
            <div className="flex justify-center gap-4 mb-8">
                <div className="flex items-center gap-1 text-sm text-foreground/50">
                    <Sparkles className="w-4 h-4" />
                    <span>Everyone can see them!</span>
                </div>
            </div>

            {/* Action button */}
            <Button onClick={onDone} variant="primary" size="lg">
                <Heart className="w-5 h-5 mr-2" />
                Continue Sharing
            </Button>
        </div>
    );
}
