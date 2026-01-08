"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useEvents } from "@/hooks/useEvents";
import { useLanguage } from "@/context/LanguageContext";
import { LayoutDashboard, Plus, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { t } = useLanguage();
    const { events, createEvent, loading } = useEvents();
    const [isCreating, setIsCreating] = useState(false);
    const [newEventName, setNewEventName] = useState("");
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventName.trim()) return;

        const event = await createEvent(newEventName);
        if (event) {
            setIsCreating(false);
            setNewEventName("");
            router.push(`/dashboard/${event.id}`);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-foreground/50">{t.loading}</div>;
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-surface rounded-xl border border-border">
                            <LayoutDashboard className="w-6 h-6 text-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">{t.dashboard}</h1>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" size="sm">{t.back}</Button>
                    </Link>
                </div>

                {/* Create Event Section */}
                {isCreating ? (
                    <Card className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <h2 className="text-xl font-medium">{t.createEvent}</h2>
                            <Input
                                placeholder={t.eventName}
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex space-x-3">
                                <Button type="button" variant="ghost" fullWidth onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" fullWidth disabled={!newEventName.trim()}>
                                    {t.create}
                                </Button>
                            </div>
                        </form>
                    </Card>
                ) : (
                    <div className="flex justify-end">
                        {/* If no events, big CTA, else small button? No, let's just put it here */}
                    </div>
                )}

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-surface/50 transition-all duration-200 h-40"
                    >
                        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-foreground/50 group-hover:text-accent" />
                        </div>
                        <span className="font-medium text-foreground/70 group-hover:text-foreground">{t.createEvent}</span>
                    </button>

                    {events.map(event => (
                        <Link key={event.id} href={`/dashboard/${event.id}`}>
                            <Card className="h-40 flex flex-col justify-between hover:border-accent/50 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl line-clamp-1">{event.name}</h3>
                                        <p className="text-sm text-foreground/40 mt-1 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-surface-end flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-foreground/60">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                        <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
                                    </div>
                                    <span>0 guests</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
