import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;


        // Verify event exists
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("id, name")
            .eq("id", eventId)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Fetch all photos
        const { data: photos, error: photosError } = await supabase
            .from("photos")
            .select("id, url, original_filename, created_at")
            .eq("event_id", eventId);

        if (photosError) {
            console.error("Error fetching photos:", photosError);
            return NextResponse.json(
                { error: "Failed to fetch photos" },
                { status: 500 }
            );
        }

        if (!photos || photos.length === 0) {
            return NextResponse.json(
                { error: "No photos to download" },
                { status: 400 }
            );
        }

        // Create ZIP file
        const zip = new JSZip();
        let successCount = 0;

        // Download and add each photo to ZIP
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];

            try {
                // Extract storage path from URL
                const storagePath = photo.url?.split("/event-photos/")[1];
                if (!storagePath) continue;

                // Download from storage
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from("event-photos")
                    .download(storagePath);

                if (downloadError || !fileData) {
                    console.error(`Error downloading ${storagePath}:`, downloadError);
                    continue;
                }

                // Add to ZIP with original filename or fallback
                const filename = photo.original_filename || `photo_${i + 1}.jpg`;
                const buffer = await fileData.arrayBuffer();
                zip.file(filename, buffer);
                successCount++;
            } catch (err) {
                console.error(`Error processing photo ${photo.id}:`, err);
            }
        }

        if (successCount === 0) {
            return NextResponse.json(
                { error: "Failed to download any photos" },
                { status: 500 }
            );
        }

        // Generate ZIP
        const zipBuffer = await zip.generateAsync({
            type: "arraybuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        // Create safe filename
        const safeEventName = event.name
            .replace(/[^a-z0-9]/gi, "-")
            .replace(/-+/g, "-")
            .substring(0, 50);
        const filename = `${safeEventName}-photos.zip`;

        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": zipBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error("Error in download:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
