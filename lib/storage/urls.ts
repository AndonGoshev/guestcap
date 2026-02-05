/**
 * Storage URL utilities
 * Handles signed URL generation with expiration
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Default expiration times
 */
export const URL_EXPIRY = {
    THUMBNAIL: 60 * 60, // 1 hour
    PREVIEW: 60 * 30, // 30 minutes  
    ORIGINAL: 60 * 5, // 5 minutes for downloads
    UPLOAD: 60 * 15, // 15 minutes for uploads
} as const;

/**
 * Generate a signed URL for viewing/downloading a file
 */
export async function getSignedUrl(
    path: string,
    expiresIn: number = URL_EXPIRY.PREVIEW
): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from("event-photos")
            .createSignedUrl(path, expiresIn);

        if (error) {
            console.error("Error creating signed URL:", error);
            return null;
        }

        return data.signedUrl;
    } catch (error) {
        console.error("Error in getSignedUrl:", error);
        return null;
    }
}

/**
 * Generate signed URLs for multiple files
 */
export async function getSignedUrls(
    paths: string[],
    expiresIn: number = URL_EXPIRY.PREVIEW
): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    try {
        const { data, error } = await supabase.storage
            .from("event-photos")
            .createSignedUrls(paths, expiresIn);

        if (error || !data) {
            console.error("Error creating signed URLs:", error);
            return urlMap;
        }

        for (const item of data) {
            if (item.signedUrl && item.path) {
                urlMap.set(item.path, item.signedUrl);
            }
        }
    } catch (error) {
        console.error("Error in getSignedUrls:", error);
    }

    return urlMap;
}

/**
 * Generate a signed upload URL
 */
export async function getSignedUploadUrl(
    path: string
): Promise<{ url: string; token: string } | null> {
    try {
        const { data, error } = await supabase.storage
            .from("event-photos")
            .createSignedUploadUrl(path);

        if (error) {
            console.error("Error creating signed upload URL:", error);
            return null;
        }

        return {
            url: data.signedUrl,
            token: data.token,
        };
    } catch (error) {
        console.error("Error in getSignedUploadUrl:", error);
        return null;
    }
}

/**
 * Extract storage path from full URL
 */
export function extractStoragePath(url: string): string | null {
    const match = url.match(/\/event-photos\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
}

/**
 * Build full public URL from path
 */
export function buildPublicUrl(path: string): string {
    return `${supabaseUrl}/storage/v1/object/public/event-photos/${path}`;
}
