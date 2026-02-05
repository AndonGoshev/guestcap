/**
 * Database queries for photos with cursor-based pagination
 */

import { supabase } from "@/lib/supabase";

export interface Photo {
    id: string;
    url: string;
    thumbnail_url?: string;
    preview_url?: string;
    guest_id: string;
    event_id: string;
    challenge_id?: string;
    created_at: string;
    guest_name?: string;
}

export interface PhotosPage {
    photos: Photo[];
    nextCursor: string | null;
    hasMore: boolean;
}

/**
 * Fetch photos with cursor-based pagination
 * Uses created_at + id as cursor for stable ordering
 */
export async function getPhotosWithCursor(
    eventId: string,
    options: {
        cursor?: string; // Format: "timestamp|id"
        limit?: number;
        challengeId?: string;
        guestId?: string;
    } = {}
): Promise<PhotosPage> {
    const { cursor, limit = 20, challengeId, guestId } = options;

    let query = supabase
        .from("photos")
        .select(`
            id,
            url,
            thumbnail_url,
            preview_url,
            guest_id,
            event_id,
            challenge_id,
            created_at,
            guests!inner(name)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1); // Fetch one extra to determine hasMore

    // Apply cursor
    if (cursor) {
        const [timestamp, id] = cursor.split("|");
        query = query.or(`created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${id})`);
    }

    // Apply filters
    if (challengeId) {
        query = query.eq("challenge_id", challengeId);
    }
    if (guestId) {
        query = query.eq("guest_id", guestId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching photos:", error);
        throw error;
    }

    const photos = (data || []).slice(0, limit).map((photo: any) => ({
        ...photo,
        guest_name: photo.guests?.name,
    }));

    const hasMore = (data?.length || 0) > limit;
    const lastPhoto = photos[photos.length - 1];
    const nextCursor = hasMore && lastPhoto
        ? `${lastPhoto.created_at}|${lastPhoto.id}`
        : null;

    return {
        photos,
        nextCursor,
        hasMore,
    };
}

/**
 * Get photo count for an event
 */
export async function getPhotoCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

    if (error) {
        console.error("Error fetching photo count:", error);
        return 0;
    }

    return count || 0;
}

/**
 * Delete a photo
 */
export async function deletePhoto(photoId: string): Promise<boolean> {
    // Get photo to find storage path
    const { data: photo } = await supabase
        .from("photos")
        .select("url, event_id")
        .eq("id", photoId)
        .single();

    if (!photo) return false;

    // Delete from storage
    const storagePath = photo.url?.split("/event-photos/")[1];
    if (storagePath) {
        await supabase.storage.from("event-photos").remove([storagePath]);
    }

    // Delete record
    const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);

    return !error;
}
