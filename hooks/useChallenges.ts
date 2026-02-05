"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Challenge {
    id: string;
    event_id: string;
    title: string;
    created_at: string;
    filter?: string | null;
}

// Premade challenge templates
export const CHALLENGE_PRESETS = [
    { title: "Black & White Photo", filter: "grayscale(1)", icon: "🎞️" },
    { title: "Best Smile", filter: null, icon: "😊" },
    { title: "Group Photo", filter: null, icon: "👥" },
    { title: "Table Decoration", filter: null, icon: "🌸" },
    { title: "Dance Floor Moment", filter: null, icon: "💃" },
] as const;

export function useChallenges(eventId: string) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        if (!eventId) return;

        const fetchChallenges = async () => {
            const { data, error } = await supabase
                .from('challenges')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching challenges:', error);
            } else {
                setChallenges(data || []);
            }
        };

        fetchChallenges();

        // Setup realtime subscription
        const channel = supabase
            .channel('challenges_channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'challenges', filter: `event_id=eq.${eventId}` },
                (payload) => {
                    setChallenges(prev => [...prev, payload.new as Challenge]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [eventId]);

    const addChallenge = async (title: string, filter?: string | null) => {
        const { data, error } = await supabase
            .from('challenges')
            .insert([
                { event_id: eventId, title, filter: filter || null }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding challenge:', error);
            return null;
        }

        return data;
    };

    return { challenges, addChallenge };
}

