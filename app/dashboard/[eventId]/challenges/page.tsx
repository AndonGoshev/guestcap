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
    const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

    // Enrich presets with UI details and translations
    const PRESET_OPTIONS = [
        {
            ...CHALLENGE_PRESETS[0], // B&W
            displayTitle: t.blackAndWhitePhoto || CHALLENGE_PRESETS[0].title,
            image: "/images/camera-presets/black-and-white.jpg",
            description: t.blackAndWhiteHelp
        },
        {
            ...CHALLENGE_PRESETS[1], // 90s
            displayTitle: t.ninetiesFilterTitle,
            image: "/images/camera-presets/90s.jpg",
            description: t.ninetiesFilterHelp
        }
    ];

    const handleCreate = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newChallengeTitle.trim()) return;
        addChallenge(newChallengeTitle, newChallengeFilter);
        setNewChallengeTitle("");
        setNewChallengeFilter(null);
        setIsCreating(false);
        setShowPresetsDropdown(false);
    };

    const handlePresetSelect = (preset: typeof PRESET_OPTIONS[number]) => {
        addChallenge(preset.title, preset.filter);
        setNewChallengeTitle("");
        setNewChallengeFilter(null);
        setIsCreating(false);
        setShowPresetsDropdown(false);
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link href={`/dashboard/${eventId}`}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{t.challenges}</h1>
                    </div>
                    <div className="w-full md:w-auto">
                        <Button onClick={() => setIsCreating(true)} size="sm" fullWidth className="md:w-auto h-11">
                            <Plus className="w-4 h-4 mr-2" />
                            {t.createChallenge}
                        </Button>
                    </div>
                </div>

                {/* Create Modal */}
                {isCreating && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <Card className="max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 relative overflow-visible">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">{t.createChallenge}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Manual Input */}
                            <form onSubmit={handleCreate} className="space-y-4">
                                <Input
                                    label={t.challengeTitle}
                                    value={newChallengeTitle}
                                    onChange={e => setNewChallengeTitle(e.target.value)}
                                    placeholder={t.challengePlaceholder || "Най-смешна снимка с булката"}
                                    autoFocus
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!newChallengeTitle.trim()}>
                                        {t.create}
                                    </Button>
                                </div>
                            </form>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-surface px-2 text-foreground/50">
                                        {t.or || "OR"}
                                    </span>
                                </div>
                            </div>

                            {/* Templates Dropdown */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {t.selectTemplate || "Select a Template"}
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                                        className="w-full flex items-center justify-between rounded-md border border-input bg-surface-end px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="text-foreground/70">{t.choosePreset}</span>
                                        <Sparkles className="w-4 h-4 opacity-50" />
                                    </button>

                                    {showPresetsDropdown && (
                                        <div className="absolute z-50 top-full mt-2 w-full rounded-md border border-border bg-surface text-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
                                            <div className="p-1">
                                                {PRESET_OPTIONS.map((preset, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePresetSelect(preset)}
                                                        className="w-full flex items-start gap-3 rounded-sm px-2 py-2 hover:bg-accent/20 hover:text-accent-foreground outline-none transition-colors text-left group"
                                                    >
                                                        {/* Image */}
                                                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-border group-hover:border-accent">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={preset.image}
                                                                alt={preset.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 py-1">
                                                            <div className="font-semibold flex items-center">
                                                                {preset.displayTitle}
                                                            </div>
                                                            <p className="text-xs text-foreground/60 mt-1 leading-snug">
                                                                {preset.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </Card>
                    </div>
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
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-white/20">
                                                    {challenge.filter.includes('grayscale') ? '🎬 B&W' : '📸 90s'}
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

