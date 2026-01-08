"use client";

import { useChallenges } from "@/hooks/useChallenges";
import { usePhotos } from "@/hooks/usePhotos";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, User, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

export default function ChallengePhotosPage() {
    const { eventId, challengeId } = useParams() as { eventId: string; challengeId: string };
    const { challenges } = useChallenges(eventId);
    const { photos } = usePhotos(eventId);
    const { t } = useLanguage();

    const challenge = challenges.find(c => c.id === challengeId);
    const challengePhotos = photos.filter(p => p.challenge_id === challengeId);

    if (!challenge) return <div className="p-12">{t.challengeNotFound}</div>;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/dashboard/${eventId}/challenges`}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{challenge.title}</h1>
                            <p className="text-sm text-foreground/50">{challengePhotos.length} {t.photos}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <Button variant="secondary" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            {t.downloadAll}
                        </Button>
                    </div>
                </div>

                {/* Photos Grid */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {challengePhotos.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-foreground/40 text-lg">
                            {t.noPhotosForChallenge}
                        </div>
                    ) : (
                        challengePhotos.map(photo => (
                            <div key={photo.id} className="relative break-inside-avoid rounded-xl overflow-hidden group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.url} alt="Challenge entry" className="w-full h-auto" />

                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md flex items-center text-xs text-white">
                                    <User className="w-3 h-3 mr-1" />
                                    {photo.guests?.name || t.anonymous}
                                </div>

                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
