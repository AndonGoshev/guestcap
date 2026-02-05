import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { guestToken, guestId, eventId } = body;

        if (!guestToken || !guestId || !eventId) {
            return NextResponse.json(
                { valid: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Query the guest record
        const { data: guest, error } = await supabase
            .from("guests")
            .select("id, guest_token, event_id, name")
            .eq("id", guestId)
            .eq("event_id", eventId)
            .single();

        if (error || !guest) {
            return NextResponse.json({ valid: false }, { status: 200 });
        }

        // Validate token matches
        const isValid = guest.guest_token === guestToken;

        if (isValid) {
            return NextResponse.json({
                valid: true,
                guest: {
                    id: guest.id,
                    name: guest.name,
                    eventId: guest.event_id,
                },
            });
        }

        return NextResponse.json({ valid: false });
    } catch (error) {
        console.error("Error validating guest:", error);
        return NextResponse.json(
            { valid: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
