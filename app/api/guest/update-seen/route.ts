import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { guestToken } = body;

        if (!guestToken) {
            return NextResponse.json(
                { error: "Guest token is required" },
                { status: 400 }
            );
        }

        // Update last_seen timestamp
        const { error } = await supabase
            .from("guests")
            .update({ last_seen: new Date().toISOString() })
            .eq("guest_token", guestToken);

        if (error) {
            console.error("Error updating last_seen:", error);
            // Don't return error - this is a non-critical operation
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating last seen:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
