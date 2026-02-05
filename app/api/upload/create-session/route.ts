import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadRateLimiter, checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FileInfo {
    id: string;
    name: string;
    size: number;
    type: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, guestId, guestToken, files } = body as {
            eventId: string;
            guestId: string;
            guestToken: string;
            files: FileInfo[];
        };

        // Validate inputs
        if (!eventId || !guestId || !guestToken || !files || files.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check rate limit (300 files per hour per guest)
        const rateLimit = await checkRateLimit(uploadRateLimiter, `upload:${guestId}`);
        if (!rateLimit.success) {
            return rateLimitExceededResponse(rateLimit.reset);
        }


        // Validate guest token
        const { data: guest, error: guestError } = await supabase
            .from("guests")
            .select("id, guest_token, event_id")
            .eq("id", guestId)
            .eq("guest_token", guestToken)
            .eq("event_id", eventId)
            .single();

        if (guestError || !guest) {
            return NextResponse.json(
                { error: "Invalid guest token" },
                { status: 403 }
            );
        }

        // Check event is active
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("id, is_active, storage_limit_mb, storage_used_mb")
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

        // Check storage limit
        const totalNewBytes = files.reduce((sum, f) => sum + f.size, 0);
        const totalNewMb = totalNewBytes / (1024 * 1024);
        const currentUsedMb = event.storage_used_mb || 0;
        const limitMb = event.storage_limit_mb || 10240; // 10GB default

        if (currentUsedMb + totalNewMb > limitMb) {
            return NextResponse.json({
                error: "STORAGE_LIMIT_EXCEEDED",
                used: currentUsedMb,
                limit: limitMb,
                requested: totalNewMb,
            }, { status: 400 });
        }

        // Create upload session record
        const { data: session, error: sessionError } = await supabase
            .from("upload_sessions")
            .insert([{
                guest_id: guestId,
                event_id: eventId,
                total_files: files.length,
                uploaded_files: 0,
                status: 'active',
            }])
            .select()
            .single();

        if (sessionError) {
            console.error("Error creating upload session:", sessionError);
            return NextResponse.json(
                { error: "Failed to create upload session" },
                { status: 500 }
            );
        }

        // Generate signed URLs for each file
        const signedUrls = await Promise.all(
            files.map(async (file) => {
                const fileExt = file.name.split('.').pop() || 'jpg';
                const path = `events/${eventId}/originals/${session.id}/${file.id}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from("event-photos")
                    .createSignedUploadUrl(path);

                if (error) {
                    console.error("Error creating signed URL:", error);
                    return null;
                }

                return {
                    fileId: file.id,
                    url: data.signedUrl,
                    path: path,
                };
            })
        );

        // Filter out failed URLs
        const validUrls = signedUrls.filter(Boolean);

        if (validUrls.length === 0) {
            return NextResponse.json(
                { error: "Failed to create upload URLs" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            sessionId: session.id,
            signedUrls: validUrls,
        });
    } catch (error) {
        console.error("Error in create-session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
