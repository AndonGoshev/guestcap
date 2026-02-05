import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const guestId = searchParams.get("guestId");
        const eventId = searchParams.get("eventId");

        if (!guestId || !eventId) {
            return NextResponse.json(
                { error: "guestId and eventId are required" },
                { status: 400 }
            );
        }

        // Count photos uploaded by this guest for this event
        const { count, error } = await supabase
            .from("photos")
            .select("*", { count: "exact", head: true })
            .eq("guest_id", guestId)
            .eq("event_id", eventId);

        if (error) {
            console.error("Error fetching upload count:", error);
            return NextResponse.json(
                { error: "Failed to fetch stats" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            uploadCount: count || 0,
        });
    } catch (error) {
        console.error("Error in guest stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
