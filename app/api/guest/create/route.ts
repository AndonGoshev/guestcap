import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, eventId } = body;

        if (!name || !eventId) {
            return NextResponse.json(
                { error: "Name and eventId are required" },
                { status: 400 }
            );
        }

        // Verify event exists and is active
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("id, name, is_active")
            .eq("id", eventId)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        if (event.is_active === false) {
            return NextResponse.json(
                { error: "Event is not active" },
                { status: 403 }
            );
        }

        // Create guest with auto-generated token (UUID from Postgres)
        // Note: guest_token column should have DEFAULT uuid_generate_v4()
        const { data: guest, error: guestError } = await supabase
            .from("guests")
            .insert([{
                event_id: eventId,
                name: name.trim()
            }])
            .select("id, name, event_id, guest_token, created_at")
            .single();

        if (guestError) {
            console.error("Error creating guest:", guestError);
            return NextResponse.json(
                { error: "Failed to create guest" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            guest: {
                id: guest.id,
                name: guest.name,
                event_id: guest.event_id,
                guest_token: guest.guest_token,
                created_at: guest.created_at,
            },
            event: {
                id: event.id,
                name: event.name,
            },
        });
    } catch (error) {
        console.error("Error in guest creation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
