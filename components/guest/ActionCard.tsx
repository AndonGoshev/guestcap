"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    highlighted?: boolean;
    badge?: string | number;
}

export function ActionCard({
    icon,
    title,
    subtitle,
    onClick,
    highlighted = false,
    badge,
}: ActionCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full p-4 rounded-2xl border text-left
                flex items-center gap-4
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                ${highlighted
                    ? "bg-accent/10 border-accent hover:bg-accent/20"
                    : "bg-surface border-border hover:border-accent/50"
                }
            `}
        >
            <div
                className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                    ${highlighted ? "bg-accent-gradient text-foreground" : "bg-surface-end"}
                `}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{title}</h3>
                    {badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/20 text-foreground">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-sm text-foreground/50 truncate">{subtitle}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/30 shrink-0" />
        </button>
    );
}
