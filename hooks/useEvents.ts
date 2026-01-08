"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Event {
    id: string;
    name: string;
    host_id: string;
    created_at: string;
}

export function useEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [hostId, setHostId] = useState<string | null>(null);

    // Initialize Host ID
    useEffect(() => {
        let storedHostId = localStorage.getItem('gc_host_id');
        if (!storedHostId) {
            storedHostId = crypto.randomUUID();
            localStorage.setItem('gc_host_id', storedHostId);
        }
        setHostId(storedHostId);
    }, []);

    // Fetch Events
    useEffect(() => {
        if (!hostId) return;

        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('host_id', hostId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching events:', error);
            } else {
                setEvents(data || []);
            }
            setLoading(false);
        };

        fetchEvents();
    }, [hostId]);

    const createEvent = async (name: string) => {
        if (!hostId) return null;

        const { data, error } = await supabase
            .from('events')
            .insert([
                { name, host_id: hostId }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            return null;
        }

        setEvents(prev => [data, ...prev]);
        return data;
    };

    const getEvent = (id: string) => {
        return events.find(e => e.id === id);
        // Note: In a real app we might want to fetch single event if not in list
    };

    return {
        events,
        loading,
        createEvent,
        getEvent
    };
}
