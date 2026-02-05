"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useChallenges, CHALLENGE_PRESETS } from "@/hooks/useChallenges";
import { usePhotos } from "@/hooks/usePhotos";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ArrowLeft, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ChallengesPage() {
    const { eventId } = useParams() as { eventId: string };
    const { challenges, addChallenge } = useChallenges(eventId);
    const { photos } = usePhotos(eventId);
    const { t } = useLanguage();
    const [newChallengeTitle, setNewChallengeTitle] = useState("");
    const [newChallengeFilter, setNewChallengeFilter] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showPresets, setShowPresets] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChallengeTitle.trim()) return;
        addChallenge(newChallengeTitle, newChallengeFilter);
        setNewChallengeTitle("");
        setNewChallengeFilter(null);
        setIsCreating(false);
    };

    const handlePresetSelect = (preset: typeof CHALLENGE_PRESETS[number]) => {
        addChallenge(preset.title, preset.filter);
        setShowPresets(false);
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
                        <Button onClick={() => setShowPresets(true)} variant="ghost" size="sm">
                            <Sparkles className="w-4 h-4 mr-2" />
                            {t.presets || "Presets"}
                        </Button>
                        <Button onClick={() => setIsCreating(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            {t.createChallenge}
                        </Button>
                    </div>
                </div>

                {/* Presets Modal */}
                {showPresets && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">{t.choosePreset || "Choose a Preset"}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowPresets(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {CHALLENGE_PRESETS.map((preset, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetSelect(preset)}
                                        className="w-full p-4 rounded-xl text-left font-medium transition-colors border border-border bg-surface-end hover:bg-accent/20 hover:border-accent flex items-center gap-3"
                                    >
                                        <span className="text-2xl">{preset.icon}</span>
                                        <div>
                                            <div className="font-semibold">{preset.title}</div>
                                            {preset.filter && (
                                                <div className="text-xs text-foreground/50">🎬 {t.hasFilter || "Has filter"}</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

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
                                                <img
                                                    src={lastPhoto}
                                                    alt={challenge.title}
                                                    className="w-full h-full object-cover"
                                                    style={{ filter: challenge.filter || undefined }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                                    <Sparkles className="w-8 h-8 text-accent-end/50" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            {/* Filter Badge */}
                                            {challenge.filter && (
                                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                    🎬 B&W
                                                </div>
                                            )}
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

