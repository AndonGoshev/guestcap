"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import Link from "next/link";

export function EventNotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="absolute top-6 right-6 z-10">
                <LanguageToggle />
            </div>

            <div className="text-center max-w-sm animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold mb-3">
                    Event Not Found
                </h1>

                <p className="text-foreground/60 mb-6">
                    This event doesn't exist or the link may be incorrect.
                </p>

                <Link href="/">
                    <Button variant="primary">
                        Go Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
