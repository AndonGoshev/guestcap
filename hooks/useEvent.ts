"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Event {
    id: string;
    name: string;
    host_id: string;
    created_at: string;
    is_active?: boolean;
    storage_limit_mb?: number;
    storage_used_mb?: number;
    upload_deadline?: string | null;
    tier_plan?: string;
    event_image_url?: string | null;
    expected_guests?: number | null;
}

export interface EventStats {
    totalPhotos: number;
    totalGuests: number;
    challengeCount: number;
}

interface UseEventReturn {
    event: Event | null;
    stats: EventStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useEvent(eventId: string): UseEventReturn {
    const [event, setEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<EventStats>({
        totalPhotos: 0,
        totalGuests: 0,
        challengeCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch event
            const { data: eventData, error: eventError } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single();

            if (eventError) {
                if (eventError.code === "PGRST116") {
                    setEvent(null);
                    setError("Event not found");
                } else {
                    throw eventError;
                }
                return;
            }

            setEvent(eventData);

            // Fetch stats in parallel
            const [photosResult, guestsResult, challengesResult] = await Promise.all([
                supabase
                    .from("photos")
                    .select("*", { count: "exact", head: true })
                    .eq("event_id", eventId),
                supabase
                    .from("guests")
                    .select("*", { count: "exact", head: true })
                    .eq("event_id", eventId),
                supabase
                    .from("challenges")
                    .select("*", { count: "exact", head: true })
                    .eq("event_id", eventId),
            ]);

            setStats({
                totalPhotos: photosResult.count || 0,
                totalGuests: guestsResult.count || 0,
                challengeCount: challengesResult.count || 0,
            });
        } catch (err: any) {
            console.error("Error fetching event:", err);
            setError(err.message || "Failed to load event");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!eventId) return;

        fetchEvent();

        // 1. Subscribe to Event updates (e.g. if host toggles active/inactive)
        const eventChannel = supabase
            .channel(`event_${eventId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
                (payload) => {
                    setEvent(payload.new as Event);
                }
            )
            .subscribe();

        // 2. Subscribe to Photos (to update total photo count)
        const photosChannel = supabase
            .channel(`photos_stats_${eventId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
                () => {
                    // Re-fetch stats when photos change
                    const fetchStats = async () => {
                        const { count } = await supabase
                            .from("photos")
                            .select("*", { count: "exact", head: true })
                            .eq("event_id", eventId);
                        setStats(prev => ({ ...prev, totalPhotos: count || 0 }));
                    };
                    fetchStats();
                }
            )
            .subscribe();

        // 3. Subscribe to Guests (to update guest count)
        const guestsChannel = supabase
            .channel(`guests_stats_${eventId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
                () => {
                    // Re-fetch stats when guests change
                    const fetchStats = async () => {
                        const { count } = await supabase
                            .from("guests")
                            .select("*", { count: "exact", head: true })
                            .eq("event_id", eventId);
                        setStats(prev => ({ ...prev, totalGuests: count || 0 }));
                    };
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(eventChannel);
            supabase.removeChannel(photosChannel);
            supabase.removeChannel(guestsChannel);
        };
    }, [eventId]);

    return {
        event,
        stats,
        loading,
        error,
        refetch: fetchEvent,
    };
}
