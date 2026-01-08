"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter, useParams } from "next/navigation";
import { Camera } from "lucide-react";

export default function GuestEntryPage() {
    const { eventId } = useParams() as { eventId: string };
    const { t } = useLanguage();
    const router = useRouter();
    const [name, setName] = useState("");

    useEffect(() => {
        // Check if already registered for this event
        const savedGuestId = localStorage.getItem(`gc_guest_${eventId}`);
        if (savedGuestId) {
            router.replace(`/guest/${eventId}/camera`);
        }
    }, [eventId, router]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Create guest in Supabase
            const { supabase } = await import('@/lib/supabase');
            console.log("Supabase client imported");

            const { data, error } = await supabase
                .from('guests')
                .insert([{ event_id: eventId, name: name.trim() }])
                .select()
                .single();

            if (error) {
                alert(`Error joining event: ${JSON.stringify(error)}`);
                console.error(error);
                setIsSubmitting(false);
                return;
            }

            localStorage.setItem(`gc_guest_${eventId}`, data.id);
            localStorage.setItem(`gc_guest_name_${eventId}`, data.name);
            router.push(`/guest/${eventId}/camera`);

        } catch (err: any) {
            alert(`Unexpected error: ${err.message}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
            <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-accent-gradient rounded-full flex items-center justify-center shadow-lg">
                        <Camera className="w-10 h-10 text-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{t.welcome}</h1>
                    <p className="text-foreground/60">{t.enterName}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder={t.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-center text-lg h-14"
                        autoFocus
                        disabled={isSubmitting}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="h-14 text-lg"
                        variant="primary"
                        disabled={!name.trim() || isSubmitting}
                    >
                        {isSubmitting ? "Joining..." : t.continue}
                    </Button>
                </form>
            </div>
        </div>
    );
}
