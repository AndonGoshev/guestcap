"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Event {
    id: string;
    name: string;
    host_id: string;
    created_at: string;
    is_active?: boolean;
    storage_used_mb?: number;
    storage_limit_mb?: number;
    event_image_url?: string | null;
    expected_guests?: number | null;
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

    // Fetch Events and setup real-time
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

        // Setup real-time subscription
        const channel = supabase
            .channel('events_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'events', filter: `host_id=eq.${hostId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setEvents(prev => [payload.new as Event, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setEvents(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
                    } else if (payload.eventType === 'DELETE') {
                        setEvents(prev => prev.filter(e => e.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [hostId]);

    const createEvent = async (name: string, image_url?: string | null, guest_count?: number | null) => {
        if (!hostId) return null;

        const { data, error } = await supabase
            .from('events')
            .insert([
                {
                    name,
                    host_id: hostId,
                    event_image_url: image_url || null,
                    expected_guests: guest_count || null
                }
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
    };

    const updateEvent = async (id: string, updates: Partial<Event>) => {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating event:', error);
            return null;
        }

        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
        return data;
    };

    const toggleEventActive = async (id: string) => {
        const event = events.find(e => e.id === id);
        if (!event) return null;

        const newStatus = event.is_active === false ? true : false;
        return updateEvent(id, { is_active: newStatus });
    };

    const deleteEvent = async (id: string) => {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting event:', error);
            return false;
        }

        setEvents(prev => prev.filter(e => e.id !== id));
        return true;
    };

    return {
        events,
        loading,
        createEvent,
        getEvent,
        updateEvent,
        toggleEventActive,
        deleteEvent
    };
}

