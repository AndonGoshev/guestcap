"use client";

import { Button } from "@/components/ui/Button";
import { usePhotos } from "@/hooks/usePhotos";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function GuestPhotosPage() {
    const { eventId, guestId } = useParams() as { eventId: string; guestId: string };
    const { photos } = usePhotos(eventId);
    const { t } = useLanguage();

    // guestId is now UUID from the URL
    // We don't need to decodeURIComponent for UUIDs usually, but good practice
    const guestIdUUID = decodeURIComponent(guestId);

    const guestPhotos = photos.filter(p => p.guest_id === guestIdUUID);

    // Find guest name from the first photo that has it (joined data)
    const guestName = guestPhotos[0]?.guests?.name || t.anonymous;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/dashboard/${eventId}/photos`}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{guestName}</h1>
                            <p className="text-sm text-foreground/50">{guestPhotos.length} {t.photos}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <Button variant="secondary" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            {t.download}
                        </Button>
                    </div>
                </div>

                {/* Photos Grid */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {guestPhotos.map(photo => (
                        <div key={photo.id} className="relative break-inside-avoid rounded-xl overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt="Guest photo" className="w-full h-auto" />

                            {photo.challenge_id && (
                                <div className="absolute top-2 left-2">
                                    <div className="bg-accent text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {photo.challenges?.title || t.challenge}
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
