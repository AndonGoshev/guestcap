import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { downloadRateLimiter, checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        // Check rate limit (5 downloads per hour per event)
        const rateLimit = await checkRateLimit(downloadRateLimiter, `download:${eventId}`);
        if (!rateLimit.success) {
            return rateLimitExceededResponse(rateLimit.reset);
        }

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

        // Fetch all photos with guest information
        const { data: photos, error: photosError } = await supabase
            .from("photos")
            .select(`
                id, 
                url, 
                original_filename, 
                created_at,
                guest_id,
                guests (
                    id,
                    name
                )
            `)
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

        // Group photos by guest for folder naming
        const photosByGuest = new Map<string, { guestName: string; photos: typeof photos }>();

        for (const photo of photos) {
            const guestName = (photo.guests as any)?.name || "Unknown Guest";
            const guestId = photo.guest_id || "unknown";
            const key = guestId;

            if (!photosByGuest.has(key)) {
                photosByGuest.set(key, { guestName, photos: [] });
            }
            photosByGuest.get(key)!.photos.push(photo);
        }

        // Create folders for each guest and add their photos
        for (const [guestId, { guestName, photos: guestPhotos }] of photosByGuest) {
            // Create safe folder name from guest name
            const safeFolderName = guestName
                .replace(/[^a-z0-9\s]/gi, "")
                .replace(/\s+/g, "_")
                .substring(0, 50) || "Guest";

            // Create folder in ZIP
            const folder = zip.folder(safeFolderName);
            if (!folder) continue;

            // Track filenames to avoid duplicates
            const usedFilenames = new Set<string>();

            for (let i = 0; i < guestPhotos.length; i++) {
                const photo = guestPhotos[i];

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

                    // Generate unique filename
                    let filename = photo.original_filename || `photo_${i + 1}.jpg`;

                    // Handle duplicate filenames
                    if (usedFilenames.has(filename)) {
                        const ext = filename.split('.').pop() || 'jpg';
                        const base = filename.replace(`.${ext}`, '');
                        let counter = 1;
                        while (usedFilenames.has(`${base}_${counter}.${ext}`)) {
                            counter++;
                        }
                        filename = `${base}_${counter}.${ext}`;
                    }
                    usedFilenames.add(filename);

                    // Add to folder
                    const buffer = await fileData.arrayBuffer();
                    folder.file(filename, buffer);
                    successCount++;
                } catch (err) {
                    console.error(`Error processing photo ${photo.id}:`, err);
                }
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
