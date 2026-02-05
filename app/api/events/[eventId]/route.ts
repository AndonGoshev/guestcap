import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch event details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        const { data: event, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .single();

        if (error) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Fetch stats
        const [photosResult, guestsResult, challengesResult] = await Promise.all([
            supabase.from("photos").select("*", { count: "exact", head: true }).eq("event_id", eventId),
            supabase.from("guests").select("*", { count: "exact", head: true }).eq("event_id", eventId),
            supabase.from("challenges").select("*", { count: "exact", head: true }).eq("event_id", eventId),
        ]);

        return NextResponse.json({
            event,
            stats: {
                totalPhotos: photosResult.count || 0,
                totalGuests: guestsResult.count || 0,
                challengeCount: challengesResult.count || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update event settings
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();

        // Only allow certain fields to be updated
        const allowedFields = ['is_active', 'upload_deadline', 'name'];
        const updates: Record<string, any> = {};

        for (const field of allowedFields) {
            if (field in body) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        const { data: event, error } = await supabase
            .from("events")
            .update(updates)
            .eq("id", eventId)
            .select()
            .single();

        if (error) {
            console.error("Error updating event:", error);
            return NextResponse.json(
                { error: "Failed to update event" },
                { status: 500 }
            );
        }

        return NextResponse.json({ event });
    } catch (error) {
        console.error("Error in PATCH event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete event
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        // Delete all photos from storage first
        const { data: photos } = await supabase
            .from("photos")
            .select("url")
            .eq("event_id", eventId);

        if (photos && photos.length > 0) {
            // Delete storage files
            const paths = photos
                .map(p => p.url?.split("/event-photos/")[1])
                .filter(Boolean);

            if (paths.length > 0) {
                await supabase.storage
                    .from("event-photos")
                    .remove(paths);
            }
        }

        // Delete event (will cascade to guests, photos, challenges)
        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) {
            console.error("Error deleting event:", error);
            return NextResponse.json(
                { error: "Failed to delete event" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
