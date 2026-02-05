"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useEvents } from "@/hooks/useEvents";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Modal } from "@/components/ui/Modal";
import { LayoutDashboard, Plus, ArrowRight, Calendar, Users, Camera, Image as ImageIcon, X as CloseIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
    const { t } = useLanguage();
    const { events, createEvent, loading } = useEvents();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [newEventName, setNewEventName] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventName.trim()) return;

        setIsLoading(true);
        let imageUrl = null;

        try {
            if (imageFile) {
                const extension = imageFile.name.split('.').pop();
                const filename = `event-covers/${Date.now()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from('event-photos')
                    .upload(filename, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('event-photos')
                    .getPublicUrl(filename);

                imageUrl = publicUrl;
            }

            const event = await createEvent(
                newEventName,
                imageUrl,
                guestCount ? parseInt(guestCount) : null
            );

            if (event) {
                setIsCreating(false);
                setNewEventName("");
                setGuestCount("");
                setImageFile(null);
                setImagePreview(null);
                router.push(`/dashboard/${event.id}`);
            }
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-foreground/50">{t.loading}</div>;
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto space-y-8">



                {/* Create Event Modal */}
                <Modal
                    isOpen={isCreating}
                    onClose={() => {
                        if (!isLoading) setIsCreating(false);
                    }}
                    title={t.createEvent}
                >
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-foreground/50 mb-1.5 block">
                                    {t.eventName}
                                </label>
                                <Input
                                    placeholder="e.g. Sarah & Mike's Wedding"
                                    value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-foreground/50 mb-1.5 block">
                                    {t.guestCount}
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 150"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium uppercase tracking-wider text-foreground/50 mb-1.5 block">
                                    {t.eventImage}
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative h-40 w-full rounded-2xl border-2 border-dashed border-border hover:border-accent group transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <>
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-foreground/20 group-hover:text-accent group-hover:scale-110 transition-all" />
                                            <span className="text-sm text-foreground/40 font-medium mt-2">{t.selectTemplate || "Choose Image"}</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                fullWidth
                                onClick={() => setIsCreating(false)}
                                disabled={isLoading}
                            >
                                {t.cancel}
                            </Button>
                            <Button
                                type="submit"
                                fullWidth
                                disabled={!newEventName.trim() || isLoading}
                            >
                                {isLoading ? t.loading : t.create}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Events Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create Card Button */}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-border hover:border-accent hover:bg-surface/50 transition-all duration-300 h-40 md:h-48"
                    >
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-surface border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all">
                            <Plus className="w-6 h-6 md:w-7 md:h-7 text-foreground/30 group-hover:text-accent" />
                        </div>
                        <span className="font-semibold text-base md:text-lg text-foreground/60 group-hover:text-foreground">{t.createEvent}</span>
                    </button>

                    {events.map(event => (
                        <Link key={event.id} href={`/dashboard/${event.id}`}>
                            <Card className="p-3 overflow-hidden h-auto md:h-52 group cursor-pointer hover:border-accent/40 transition-all duration-500 rounded-[2rem]">
                                <div className="flex flex-col md:flex-row h-full">
                                    {/* Left/Top: Image */}
                                    <div className="w-full md:w-1/3 h-48 md:h-full relative overflow-hidden rounded-[1.5rem]">
                                        <Image
                                            src={event.event_image_url || "/images/events/default-event-image.jpg"}
                                            alt={event.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 md:from-black/20 to-transparent" />
                                    </div>

                                    {/* Right/Bottom: Content */}
                                    <div className="w-full md:w-2/3 p-4 md:px-6 md:py-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-accent transition-colors">{event.name}</h3>
                                                <div className="p-2 rounded-full bg-surface opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    <ArrowRight className="w-4 h-4 text-accent" />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 mt-3">
                                                <p className="text-xs text-foreground/40 flex items-center bg-surface px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(event.created_at).toLocaleDateString()}
                                                </p>
                                                {event.expected_guests && (
                                                    <p className="text-xs text-foreground/40 flex items-center bg-surface px-2 py-1 rounded-md">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {event.expected_guests} {t.guests}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <div className="flex items-center space-x-2 text-sm text-foreground/60">
                                                <div className="flex -space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-accent-end">
                                                        <ImageIcon className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <span className="font-medium">0 {t.photos}</span>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${event.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
