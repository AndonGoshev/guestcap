"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePhotos, Photo } from "@/hooks/usePhotos";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ArrowLeft, User, Download, Folder } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AllPhotosPage() {
    const { eventId } = useParams() as { eventId: string };
    const { photos } = usePhotos(eventId);
    const { t } = useLanguage();

    // Group by guest UUID to ensure unique folders and correct links
    const guestGroups: Record<string, { name: string; photos: Photo[] }> = {};

    photos.forEach(p => {
        const guestId = p.guest_id;
        const guestName = p.guests?.name || t.anonymous;

        if (!guestGroups[guestId]) {
            guestGroups[guestId] = { name: guestName, photos: [] };
        }
        guestGroups[guestId].photos.push(p);
    });

    const guests = Object.entries(guestGroups).map(([id, data]) => ({
        id,
        name: data.name,
        count: data.photos.length,
        lastPhoto: data.photos[0]?.url // Photos are sorted desc
    }));

    // Sorting could be added here

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/dashboard/${eventId}`}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{t.allPhotos}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <Button variant="secondary" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            {t.downloadAll}
                        </Button>
                    </div>
                </div>

                {/* Guests Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {guests.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-foreground/40">
                            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            {t.noGuestsUploaded}
                        </div>
                    ) : (
                        guests.map(guest => (
                            <Link key={guest.id} href={`/dashboard/${eventId}/photos/${guest.id}`}>
                                <Card className="hover:border-accent transition-all group cursor-pointer p-4 space-y-3">
                                    <div className="aspect-square bg-surface-end rounded-xl overflow-hidden relative">
                                        {guest.lastPhoto ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={guest.lastPhoto} alt={guest.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-8 h-8 text-foreground/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold truncate">{guest.name}</h3>
                                        <p className="text-xs text-foreground/50">{guest.count} {t.photos}</p>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
