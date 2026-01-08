"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useChallenges } from "@/hooks/useChallenges";
import { usePhotos } from "@/hooks/usePhotos";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ArrowLeft, Plus, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ChallengesPage() {
    const { eventId } = useParams() as { eventId: string };
    const { challenges, addChallenge } = useChallenges(eventId);
    const { photos } = usePhotos(eventId); // We need this to count/show photos
    const { t } = useLanguage();
    const [newChallengeTitle, setNewChallengeTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChallengeTitle.trim()) return;
        addChallenge(newChallengeTitle);
        setNewChallengeTitle("");
        setIsCreating(false);
    };

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
                        <h1 className="text-2xl font-bold">{t.challenges}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <Button onClick={() => setIsCreating(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            {t.createChallenge}
                        </Button>
                    </div>
                </div>

                {/* Create Input */}
                {isCreating && (
                    <Card className="animate-in slide-in-from-top-2">
                        <form onSubmit={handleCreate} className="flex gap-4 items-end">
                            <Input
                                label={t.challengeTitle}
                                value={newChallengeTitle}
                                onChange={e => setNewChallengeTitle(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2 pb-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>{t.cancel}</Button>
                                <Button type="submit">{t.create}</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Challenges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {challenges.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-foreground/40">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{t.noChallengesYet}</p>
                        </div>
                    ) : (
                        challenges.map(challenge => {
                            const challengePhotos = photos.filter(p => p.challenge_id === challenge.id);
                            const lastPhoto = challengePhotos[0]?.url;

                            return (
                                <Link key={challenge.id} href={`/dashboard/${eventId}/challenges/${challenge.id}`}>
                                    <Card className="hover:border-accent transition-all group cursor-pointer p-4 space-y-3 h-full">
                                        <div className="aspect-square bg-surface-end rounded-xl overflow-hidden relative">
                                            {lastPhoto ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={lastPhoto} alt={challenge.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                                    <Sparkles className="w-8 h-8 text-accent-end/50" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-semibold truncate px-1" title={challenge.title}>{challenge.title}</h3>
                                            <p className="text-xs text-foreground/50">{challengePhotos.length} {t.photos}</p>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
