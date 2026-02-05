"use client";

import React from "react";

interface PersonalizedGreetingProps {
    guestName: string;
    isReturning: boolean;
    uploadCount?: number;
}

export function PersonalizedGreeting({
    guestName,
    isReturning,
    uploadCount = 0,
}: PersonalizedGreetingProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();

        if (isReturning) {
            if (hour < 12) return `Good morning, ${guestName}! 👋`;
            if (hour < 17) return `Welcome back, ${guestName}! 🌟`;
            return `Good evening, ${guestName}! ✨`;
        }

        return `Hi ${guestName}! 🎉`;
    };

    const getMessage = () => {
        if (isReturning) {
            if (uploadCount === 0) {
                return "Ready to share some memories?";
            }
            if (uploadCount < 5) {
                return "Keep the memories coming!";
            }
            if (uploadCount < 10) {
                return "You're on fire! 🔥";
            }
            return "You're a photo superstar! ⭐";
        }

        return "Let's capture some memories together";
    };

    return (
        <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h1 className="text-2xl font-bold mb-1">{getGreeting()}</h1>
            <p className="text-foreground/60">{getMessage()}</p>
        </div>
    );
}
