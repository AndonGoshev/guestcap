import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, guestToken, uploadedPaths } = body as {
            sessionId: string;
            guestToken: string;
            uploadedPaths: string[];
        };

        // Validate inputs
        if (!sessionId || !guestToken || !uploadedPaths) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get session and validate
        const { data: session, error: sessionError } = await supabase
            .from("upload_sessions")
            .select("*, guests!inner(guest_token, event_id)")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Validate guest token
        if (session.guests.guest_token !== guestToken) {
            return NextResponse.json(
                { error: "Invalid guest token" },
                { status: 403 }
            );
        }

        const eventId = session.event_id;
        const guestId = session.guest_id;

        // Create photo records for each uploaded file
        const photoRecords = uploadedPaths.map((path) => ({
            event_id: eventId,
            guest_id: guestId,
            upload_session_id: sessionId,
            url: `${supabaseUrl}/storage/v1/object/public/event-photos/${path}`,
            status: 'pending', // Will be processed for thumbnails/previews
            original_filename: path.split('/').pop() || 'unknown',
        }));

        const { data: photos, error: photosError } = await supabase
            .from("photos")
            .insert(photoRecords)
            .select();

        if (photosError) {
            console.error("Error creating photo records:", photosError);
            return NextResponse.json(
                { error: "Failed to create photo records" },
                { status: 500 }
            );
        }

        // Calculate total size of uploaded files
        let totalBytes = 0;
        for (const path of uploadedPaths) {
            try {
                const { data: fileData } = await supabase.storage
                    .from("event-photos")
                    .list(path.replace(/\/[^/]+$/, ''), {
                        search: path.split('/').pop(),
                    });

                if (fileData && fileData[0]) {
                    totalBytes += fileData[0].metadata?.size || 0;
                }
            } catch (e) {
                // Ignore size calculation errors
            }
        }

        // Update storage usage (approximate since we can't always get exact size)
        const totalMb = totalBytes / (1024 * 1024);
        if (totalMb > 0) {
            await supabase.rpc('increment_storage', {
                p_event_id: eventId,
                p_bytes: totalBytes,
            });
        }

        // Update session status
        await supabase
            .from("upload_sessions")
            .update({
                uploaded_files: uploadedPaths.length,
                status: 'completed',
            })
            .eq("id", sessionId);

        return NextResponse.json({
            success: true,
            photosCreated: photos?.length || 0,
            photoIds: photos?.map(p => p.id) || [],
        });
    } catch (error) {
        console.error("Error in complete upload:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
