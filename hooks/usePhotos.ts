"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Photo {
    id: string;
    event_id: string;
    guest_id: string;
    challenge_id?: string;
    url: string;
    created_at: string;
    guests?: {
        name: string;
    }
    challenges?: {
        title: string;
    }
}

export function usePhotos(eventId: string) {
    const [photos, setPhotos] = useState<Photo[]>([]);

    const fetchPhotos = async () => {
        const { data, error } = await supabase
            .from('photos')
            .select('*, guests(name), challenges(title)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setPhotos(data as any || []);
    };

    useEffect(() => {
        if (!eventId) return;

        fetchPhotos();

        const channel = supabase
            .channel('photos_channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
                () => {
                    // Re-fetch to get the join data (guest name)
                    fetchPhotos();
                }
            )
            .subscribe();



        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    const addPhoto = async (photo: Omit<Photo, 'id' | 'created_at'>) => {
        try {
            // 1. Convert DataURL to Blob
            const blob = await (await fetch(photo.url)).blob();
            const filename = `${eventId}/${photo.guest_id}/${Date.now()}.jpg`;

            // 2. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('event-photos')
                .upload(filename, blob);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('event-photos')
                .getPublicUrl(filename);

            // 4. Insert to DB
            const { data, error: dbError } = await supabase
                .from('photos')
                .insert([{
                    event_id: photo.event_id,
                    guest_id: photo.guest_id, // This must be the UUID
                    challenge_id: photo.challenge_id || null,
                    url: publicUrl
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            return true;
        } catch (e) {
            console.error("Upload failed:", e);
            return false;
        }
    };

    return { photos, addPhoto };
}
