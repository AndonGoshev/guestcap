"use client";

import React, { useState, useEffect } from "react";
import { Users, Image, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

interface Guest {
    id: string;
    name: string;
    created_at: string;
    last_seen?: string;
    photoCount?: number;
}

interface GuestListProps {
    eventId: string;
}

export function GuestList({ eventId }: GuestListProps) {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGuests() {
            setLoading(true);

            // Fetch guests
            const { data: guestData, error } = await supabase
                .from("guests")
                .select("*")
                .eq("event_id", eventId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching guests:", error);
                setLoading(false);
                return;
            }

            // Fetch photo counts for each guest
            const guestsWithCounts = await Promise.all(
                (guestData || []).map(async (guest) => {
                    const { count } = await supabase
                        .from("photos")
                        .select("*", { count: "exact", head: true })
                        .eq("guest_id", guest.id);

                    return {
                        ...guest,
                        photoCount: count || 0,
                    };
                })
            );

            setGuests(guestsWithCounts);
            setLoading(false);
        }

        fetchGuests();
    }, [eventId]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return null;
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    if (loading) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-foreground/50" />
                    <h3 className="font-semibold">Guests</h3>
                </div>
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-surface-end rounded-lg" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-foreground/50" />
                    <h3 className="font-semibold">Guests</h3>
                </div>
                <span className="text-sm text-foreground/50">{guests.length} total</span>
            </div>

            {guests.length === 0 ? (
                <p className="text-sm text-foreground/50 text-center py-4">
                    No guests have joined yet
                </p>
            ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {guests.map((guest) => (
                        <div
                            key={guest.id}
                            className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-surface-end transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                        {guest.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{guest.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-foreground/50">
                                        <span className="flex items-center gap-1">
                                            <Image className="w-3 h-3" />
                                            {guest.photoCount}
                                        </span>
                                        {guest.last_seen && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {getTimeAgo(guest.last_seen)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-foreground/30" />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
