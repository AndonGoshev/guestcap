# Phase 4: Storage Lifecycle & Tiering

> **Priority**: 🟠 High (Cost control)  
> **Estimated Effort**: 4-5 hours  
> **Dependencies**: Phase 1 (Database Schema), Phase 3 (Chunked Uploads)

---

## 📋 Overview

Implement a multi-tier storage system with automatic image processing to control costs while maintaining quality. Originals are stored temporarily, while optimized versions are used for browsing.

---

## 🎯 Storage Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: ORIGINALS                             │
├─────────────────────────────────────────────────────────────────┤
│  • Full resolution, uncompressed                                │
│  • Lifecycle: 30-90 days based on plan                          │
│  • Used for: Host downloads, archive                            │
│  • Path: /events/{eventId}/originals/{photoId}                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Auto-generated)
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: PREVIEWS                              │
├─────────────────────────────────────────────────────────────────┤
│  • Optimized resolution (2000px max, ~2-3MB)                    │
│  • Lifecycle: Permanent (until event deleted)                   │
│  • Used for: Gallery viewing, full-screen                       │
│  • Path: /events/{eventId}/previews/{photoId}                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Auto-generated)
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 3: THUMBNAILS                            │
├─────────────────────────────────────────────────────────────────┤
│  • Small resolution (400px, ~100-200KB)                         │
│  • Lifecycle: Permanent                                          │
│  • Used for: Grids, lists, quick loading                        │
│  • Path: /events/{eventId}/thumbs/{photoId}                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tasks

### 4.1 Image Processing Pipeline

Create an Edge Function or API route for processing:

```typescript
// app/api/process-image/route.ts
// OR supabase/functions/process-image/index.ts

async function processUploadedImage(photoId: string, eventId: string) {
    // 1. Download original from storage
    const original = await downloadFromStorage(
        `events/${eventId}/originals/${photoId}`
    );
    
    // 2. Generate preview (2000px max dimension)
    const preview = await resizeImage(original, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 85,
        format: 'webp'
    });
    
    // 3. Generate thumbnail (400px)
    const thumbnail = await resizeImage(original, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 80,
        format: 'webp'
    });
    
    // 4. Upload processed versions
    await uploadToStorage(`events/${eventId}/previews/${photoId}`, preview);
    await uploadToStorage(`events/${eventId}/thumbs/${photoId}`, thumbnail);
    
    // 5. Update photo record with URLs
    await updatePhotoUrls(photoId, {
        preview_url: getPublicUrl(`events/${eventId}/previews/${photoId}`),
        thumbnail_url: getPublicUrl(`events/${eventId}/thumbs/${photoId}`),
        status: 'ready'
    });
}
```

---

### 4.2 Processing Queue System

```typescript
// lib/processing/queue.ts

// Option 1: Database-based queue
// Photos with status='pending' are picked up by a cron job

// Option 2: Supabase Edge Function triggered on insert
// More real-time, but requires Edge Functions billing

// Option 3: Webhook on storage upload
// Supabase can trigger webhooks when files are uploaded
```

**Recommended: Database Queue with Polling**

```sql
-- Cron job runs every minute
-- Picks up oldest 10 pending photos
-- Processes in parallel
```

---

### 4.3 Lifecycle Policies

```typescript
// lib/storage/lifecycle.ts

interface LifecyclePolicy {
    tier: 'essential' | 'wedding' | 'pro';
    originalRetentionDays: number;
    previewRetentionDays: number;
}

const LIFECYCLE_POLICIES: Record<string, LifecyclePolicy> = {
    essential: {
        tier: 'essential',
        originalRetentionDays: 30,
        previewRetentionDays: 180
    },
    wedding: {
        tier: 'wedding',
        originalRetentionDays: 60,
        previewRetentionDays: 365
    },
    pro: {
        tier: 'pro',
        originalRetentionDays: 90,
        previewRetentionDays: -1 // Forever
    }
};
```

---

### 4.4 Cleanup Cron Job

```typescript
// app/api/cron/cleanup-storage/route.ts

export async function GET(request: Request) {
    // Verify cron secret
    
    // Find photos past retention
    const expiredPhotos = await supabase
        .from('photos')
        .select('id, event_id, url')
        .lt('created_at', getExpirationDate())
        .eq('original_deleted', false);
    
    for (const photo of expiredPhotos) {
        // Delete original from storage
        await supabase.storage
            .from('event-photos')
            .remove([`events/${photo.event_id}/originals/${photo.id}`]);
        
        // Mark as deleted in DB
        await supabase
            .from('photos')
            .update({ original_deleted: true })
            .eq('id', photo.id);
    }
    
    return Response.json({ cleaned: expiredPhotos.length });
}
```

---

### 4.5 Lazy ZIP Generation

**Do NOT pre-create ZIPs.** Generate on-demand:

```typescript
// app/api/download/event/[eventId]/route.ts

export async function GET(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    const { eventId } = params;
    
    // 1. Verify host ownership
    // 2. Get all photo original URLs
    // 3. Stream ZIP generation
    // 4. Return as downloadable file
    
    const photos = await getEventPhotos(eventId);
    const zip = new JSZip();
    
    for (const photo of photos) {
        const file = await fetch(photo.url);
        zip.file(photo.original_filename, await file.blob());
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return new Response(zipBlob, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${eventId}.zip"`
        }
    });
}
```

---

### 4.6 Storage Tracking

Update storage usage in real-time:

```typescript
// After upload complete:
async function updateStorageUsage(eventId: string, bytesAdded: number) {
    await supabase.rpc('increment_storage', {
        event_id: eventId,
        bytes: bytesAdded
    });
}

// SQL function:
CREATE OR REPLACE FUNCTION increment_storage(event_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE events 
    SET storage_used_mb = storage_used_mb + (bytes / 1048576.0)
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Verification

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| Upload photo | Original, preview, thumbnail created |
| View gallery | Loads thumbnails, not originals |
| Full-screen view | Loads preview, not original |
| Download button | Downloads original (if still available) |
| After retention period | Original deleted, preview remains |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `lib/processing/image-processor.ts` | Image resize logic |
| CREATE | `lib/processing/queue.ts` | Processing queue |
| CREATE | `app/api/process-image/route.ts` | Processing endpoint |
| CREATE | `app/api/cron/cleanup-storage/route.ts` | Cleanup job |
| CREATE | `app/api/download/event/[eventId]/route.ts` | ZIP generation |
| CREATE | `lib/storage/lifecycle.ts` | Lifecycle policies |

---

## 📦 Required Packages

```bash
npm install sharp jszip
```

- **sharp**: High-performance image processing
- **jszip**: ZIP file generation
