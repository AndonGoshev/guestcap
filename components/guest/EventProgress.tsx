"use client";

import React from "react";
import { Image, Users, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface EventProgressProps {
    totalPhotos: number;
    totalGuests: number;
    photoGoal?: number;
}

export function EventProgress({
    totalPhotos,
    totalGuests,
    photoGoal = 100,
}: EventProgressProps) {
    const percentage = Math.min((totalPhotos / photoGoal) * 100, 100);
    const isComplete = percentage >= 100;

    return (
        <Card className="p-4">
            {/* Progress ring visual */}
            <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background circle */}
                        <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-surface-end"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="2"
                            strokeDasharray={`${percentage}, 100`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="var(--color-accent)" />
                                <stop offset="100%" stopColor="var(--color-accent-end)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Center icon/number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isComplete ? (
                            <span className="text-lg">🎉</span>
                        ) : (
                            <span className="text-xs font-bold">{Math.round(percentage)}%</span>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <p className="font-medium mb-1">
                        {isComplete ? "Goal Reached! 🎉" : "Event Progress"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                        <span className="flex items-center gap-1">
                            <Image className="w-4 h-4" />
                            {totalPhotos} photos
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {totalGuests} guests
                        </span>
                    </div>
                </div>
            </div>

            {/* Social proof message */}
            {totalPhotos > 0 && !isComplete && (
                <p className="text-xs text-foreground/50 mt-3 text-center">
                    {totalPhotos < 20
                        ? "Help us reach our first 20 photos! 📸"
                        : totalPhotos < 50
                            ? `${50 - totalPhotos} more photos until halfway there!`
                            : `Almost at ${photoGoal}! Keep sharing!`
                    }
                </p>
            )}
        </Card>
    );
}
