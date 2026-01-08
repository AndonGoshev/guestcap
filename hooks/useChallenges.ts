"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Challenge {
    id: string;
    event_id: string;
    title: string;
    created_at: string;
}

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

    const addChallenge = async (title: string) => {
        const { data, error } = await supabase
            .from('challenges')
            .insert([
                { event_id: eventId, title }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding challenge:', error);
            return null;
        }

        // We rely on subscription to update state, or we can update optimistically/manually
        // Let's update manualy to be sure
        // setChallenges(prev => [...prev, data]); 
        // actually subscription handles it but double check is fine. duplicate key if id match? 
        // let's just trigger it or return it. 
        return data;
    };

    return { challenges, addChallenge };
}
