"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEvents } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import { useChallenges } from "@/hooks/useChallenges";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, Share2, Folder, Image as ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function EventDashboard() {
    const { eventId } = useParams() as { eventId: string };
    const { getEvent } = useEvents();
    const event = getEvent(eventId);
    const { photos } = usePhotos(eventId); // Fetch photos for count
    const { challenges } = useChallenges(eventId); // Fetch challenges for count
    const { t } = useLanguage();

    const [baseUrl, setBaseUrl] = useState("");
    const [isEditingUrl, setIsEditingUrl] = useState(false);

    // Set initial base url
    if (typeof window !== 'undefined' && !baseUrl) {
        setBaseUrl(window.location.origin);
    }

    if (!event) return <div className="p-12">Event not found</div>;

    const eventUrl = `${baseUrl}/guest/${eventId}`;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="pl-0">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.dashboard}
                        </Button>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground/50">ID: {eventId.slice(0, 8)}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Main Info */}
                    <div className="flex-1 space-y-8 w-full">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">{event.name}</h1>
                            <p className="text-foreground/60">Created on {new Date(event.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Folders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href={`/dashboard/${eventId}/photos`}>
                                <Card className="h-40 flex flex-col justify-between hover:border-accent transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-surface-end rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-foreground/70" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">{t.allPhotos}</h3>
                                        <p className="text-sm text-foreground/40">{photos.length} photos</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href={`/dashboard/${eventId}/challenges`}>
                                <Card className="h-40 flex flex-col justify-between hover:border-accent transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-6 h-6 text-accent-end" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">{t.challenges}</h3>
                                        <p className="text-sm text-foreground/40">{challenges.length} active</p>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* Right: QR Card */}
                    <Card className="w-full md:w-80 flex flex-col items-center text-center space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-bold">Guest Access</h3>
                            <p className="text-sm text-foreground/60">Scan to join event</p>

                            <div className="pt-2">
                                {/* Only allow editing URL in DEBUG mode (for tunneling) */}
                                {process.env.NEXT_PUBLIC_DEBUG === 'true' ? (
                                    isEditingUrl ? (
                                        <div className="flex gap-2">
                                            <input
                                                className="text-xs border rounded px-2 py-1 w-full bg-surface"
                                                value={baseUrl}
                                                onChange={(e) => setBaseUrl(e.target.value)}
                                                placeholder="http://192.168.x.x:3000"
                                            />
                                            <button onClick={() => setIsEditingUrl(false)} className="text-xs bg-accent px-2 rounded">
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <p
                                            onClick={() => setIsEditingUrl(true)}
                                            className="text-xs text-foreground/30 cursor-pointer hover:text-accent underline decoration-dotted"
                                            title="Click to change domain for local testing"
                                        >
                                            {baseUrl || "Loading..."} (Debug Mode)
                                        </p>
                                    )
                                ) : (
                                    /* Normal Mode: Just show the standard URL */
                                    <p className="text-xs text-foreground/30">
                                        {baseUrl}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            {eventUrl && (
                                <QRCodeSVG value={eventUrl} size={200} level="H" />
                            )}
                        </div>

                        <div className="w-full space-y-2">
                            <Button fullWidth variant="primary" onClick={() => window.print()}>
                                Print QR Cards
                            </Button>
                            <p className="text-xs text-foreground/40">Use <code className="bg-black/5 px-1 rounded">npm run dev -- -H 0.0.0.0</code> to access locally</p>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
