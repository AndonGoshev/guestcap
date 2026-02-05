"use client";

import React from "react";
import { HardDrive, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StorageWidgetProps {
    usedMb: number;
    limitMb: number;
    tierPlan: string;
    onUpgrade?: () => void;
}

export function StorageWidget({
    usedMb,
    limitMb,
    tierPlan,
    onUpgrade,
}: StorageWidgetProps) {
    const percentage = Math.min((usedMb / limitMb) * 100, 100);
    const isNearLimit = percentage > 80;
    const isAtLimit = percentage >= 100;

    const formatSize = (mb: number): string => {
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    const getPlanDisplay = (plan: string): string => {
        const plans: Record<string, string> = {
            essential: 'Essential',
            wedding: 'Wedding',
            pro: 'Pro',
        };
        return plans[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-foreground/50" />
                    <h3 className="font-semibold">Storage</h3>
                </div>
                <span className="text-xs px-2 py-1 bg-accent/10 text-foreground/70 rounded-full">
                    {getPlanDisplay(tierPlan)} Plan
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-surface-end rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-500 ${isAtLimit
                            ? "bg-red-500"
                            : isNearLimit
                                ? "bg-yellow-500"
                                : "bg-accent-gradient"
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Stats */}
            <div className="flex justify-between text-sm mb-3">
                <span className="text-foreground/70">{formatSize(usedMb)} used</span>
                <span className="text-foreground/50">{formatSize(limitMb)} total</span>
            </div>

            {/* Warnings */}
            {isNearLimit && !isAtLimit && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm mb-3 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Approaching limit</p>
                        <p className="text-yellow-600">Consider upgrading for more storage.</p>
                    </div>
                </div>
            )}

            {isAtLimit && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-3">
                    <p className="font-medium">🚫 Storage limit reached</p>
                    <p className="text-red-600">New uploads are blocked. Upgrade to continue.</p>
                </div>
            )}

            {/* Upgrade button */}
            {onUpgrade && (isNearLimit || isAtLimit) && (
                <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={onUpgrade}
                >
                    Upgrade Plan
                </Button>
            )}
        </Card>
    );
}
