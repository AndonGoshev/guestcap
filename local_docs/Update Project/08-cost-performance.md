# Phase 8: Cost Control & Performance

> **Priority**: 🟠 High (Scalability)  
> **Estimated Effort**: 3-4 hours  
> **Dependencies**: Phase 1 (Database Schema), Phase 4 (Storage Lifecycle)

---

## 📋 Overview

Implement cost guardrails and performance optimizations to ensure the app scales efficiently to 10,000+ photos per event without slowdowns or runaway costs.

---

## 🎯 Key Optimizations

1. **Cursor-based pagination** → No offset slowdown
2. **Image tier loading** → Thumbnails first, never originals
3. **Download rate limiting** → Prevent bandwidth abuse
4. **Storage enforcement** → Hard limits on uploads
5. **Signed URL expiration** → Short-lived download links

---

## 🎯 Tasks

### 8.1 Cursor-Based Pagination

Replace offset pagination with cursor-based:

```typescript
// lib/db/photos.ts

interface PhotoQueryOptions {
    eventId: string;
    cursor?: string; // ISO timestamp of last item
    limit?: number;
}

export async function getEventPhotos({ 
    eventId, 
    cursor, 
    limit = 30 
}: PhotoQueryOptions) {
    let query = supabase
        .from('photos')
        .select('id, thumbnail_url, preview_url, created_at, guest_id')
        .eq('event_id', eventId)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(limit);
    
    // Cursor-based pagination (NOT offset)
    if (cursor) {
        query = query.lt('created_at', cursor);
    }
    
    const { data, error } = await query;
    
    return {
        photos: data,
        nextCursor: data && data.length === limit 
            ? data[data.length - 1].created_at 
            : null
    };
}
```

**Why cursor pagination?**
- `OFFSET 10000` requires scanning 10,000 rows
- `WHERE created_at < '...'` uses index directly
- Consistent performance at any scale

---

### 8.2 Index Optimization

Ensure critical indexes exist:

```sql
-- Primary query index (CRITICAL for gallery performance)
CREATE INDEX IF NOT EXISTS idx_photos_event_created_status 
ON photos(event_id, status, created_at DESC);

-- Guest lookup
CREATE INDEX IF NOT EXISTS idx_photos_guest 
ON photos(guest_id, created_at DESC);

-- Upload session tracking
CREATE INDEX IF NOT EXISTS idx_photos_session_status 
ON photos(upload_session_id, status);

-- Event storage query
CREATE INDEX IF NOT EXISTS idx_events_host_active 
ON events(host_id, is_active);

-- Analyze tables after index creation
ANALYZE photos;
ANALYZE events;
ANALYZE guests;
```

---

### 8.3 Never Load Originals in Gallery

Enforce thumbnail/preview loading:

```typescript
// components/gallery/PhotoGrid.tsx

// NEVER include original URL in gallery queries
const { data: photos } = await supabase
    .from('photos')
    .select('id, thumbnail_url, preview_url, created_at') // NO original_url!
    .eq('event_id', eventId);

// In component
<img 
    src={photo.thumbnail_url}  // Grid view
    loading="lazy"
    onClick={() => openLightbox(photo.preview_url)} // Full view uses preview
/>
```

**Original URL only requested for:**
- Explicit download button click
- Bulk ZIP generation

---

### 8.4 Storage Limit Enforcement

Hard-stop uploads when limit reached:

```typescript
// app/api/upload/create-session/route.ts

async function createUploadSession(request: Request) {
    const { eventId, files } = await request.json();
    
    // Calculate total size of new files
    const totalNewBytes = files.reduce((sum, f) => sum + f.size, 0);
    const totalNewMb = totalNewBytes / (1024 * 1024);
    
    // Get current usage
    const { data: event } = await supabase
        .from('events')
        .select('storage_used_mb, storage_limit_mb')
        .eq('id', eventId)
        .single();
    
    // Check limit
    if (event.storage_used_mb + totalNewMb > event.storage_limit_mb) {
        return Response.json({
            error: 'STORAGE_LIMIT_EXCEEDED',
            used: event.storage_used_mb,
            limit: event.storage_limit_mb,
            requested: totalNewMb
        }, { status: 400 });
    }
    
    // Proceed with upload session creation
}
```

**Client handling:**

```tsx
// components/upload/UploadError.tsx

if (error.code === 'STORAGE_LIMIT_EXCEEDED') {
    return (
        <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h3>Storage Limit Reached</h3>
            <p>The event has reached its {error.limit}GB storage limit.</p>
            <p>Contact the host to upgrade their plan.</p>
        </div>
    );
}
```

---

### 8.5 Download Rate Limiting

Prevent bandwidth abuse:

```typescript
// app/api/download/event/[eventId]/route.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, '1h'), // 3 downloads per hour
});

export async function GET(request: Request, { params }) {
    const { eventId } = params;
    const userId = await getCurrentUserId();
    
    // Rate limit by user
    const { success, remaining, reset } = await ratelimit.limit(`download:${userId}`);
    
    if (!success) {
        return Response.json({
            error: 'RATE_LIMITED',
            message: 'Too many downloads. Please wait before trying again.',
            retryAfter: reset
        }, { 
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000))
            }
        });
    }
    
    // Continue with download
}
```

---

### 8.6 Signed URL Expiration

Short-lived URLs for all storage access:

```typescript
// lib/storage/urls.ts

const URL_EXPIRATION = {
    thumbnail: 3600,      // 1 hour (frequently viewed)
    preview: 3600,        // 1 hour
    original: 900,        // 15 minutes (download only)
    upload: 900           // 15 minutes
};

export async function getSignedUrl(
    bucket: string, 
    path: string, 
    type: 'thumbnail' | 'preview' | 'original' | 'upload'
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, URL_EXPIRATION[type]);
    
    return data?.signedUrl;
}
```

---

### 8.7 Lazy Loading & Virtualization

For large galleries, use virtualization:

```tsx
// components/gallery/VirtualizedGrid.tsx

import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedGrid({ photos }: { photos: Photo[] }) {
    const parentRef = useRef<HTMLDivElement>(null);
    
    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(photos.length / 4), // 4 columns
        getScrollElement: () => parentRef.current,
        estimateSize: () => 200, // row height
        overscan: 5
    });
    
    return (
        <div ref={parentRef} className="h-screen overflow-auto">
            <div style={{ height: rowVirtualizer.getTotalSize() }}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => (
                    <div
                        key={virtualRow.key}
                        style={{
                            position: 'absolute',
                            top: virtualRow.start,
                            height: virtualRow.size,
                        }}
                        className="grid grid-cols-4 gap-2"
                    >
                        {photos
                            .slice(virtualRow.index * 4, (virtualRow.index + 1) * 4)
                            .map(photo => (
                                <img 
                                    key={photo.id}
                                    src={photo.thumbnail_url}
                                    loading="lazy"
                                />
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

### 8.8 Monitoring Dashboard (Optional)

Track key metrics:

```typescript
// lib/monitoring/metrics.ts

interface EventMetrics {
    eventId: string;
    photoCount: number;
    storageUsedMb: number;
    guestCount: number;
    avgUploadSize: number;
    uploadRate: number; // per hour
}

// Log metrics on key actions
await logMetric('upload_complete', {
    eventId,
    fileSize,
    processingTime
});
```

---

## ✅ Verification

### Performance Testing

```bash
# Test pagination at scale
# Insert 10,000 test photos
# Query with different page sizes

# Verify EXPLAIN ANALYZE shows index usage:
EXPLAIN ANALYZE
SELECT id, thumbnail_url, created_at
FROM photos
WHERE event_id = 'xxx' AND status = 'ready'
ORDER BY created_at DESC
LIMIT 30;

# Should show: Index Scan using idx_photos_event_created_status
```

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| Gallery with 10k photos | Fast loading, smooth scroll |
| Upload at limit | Error message, upload blocked |
| 4th download in hour | Rate limit error |
| View original | Short-lived signed URL |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `lib/db/photos.ts` | Cursor pagination queries |
| CREATE | `lib/storage/urls.ts` | Signed URL management |
| CREATE | `lib/ratelimit/download.ts` | Rate limiting |
| CREATE | `components/gallery/VirtualizedGrid.tsx` | Virtualized list |
| UPDATE | `app/api/upload/create-session/route.ts` | Storage enforcement |
| UPDATE | `app/api/download/event/[eventId]/route.ts` | Rate limiting |

---

## 📦 Required Packages

```bash
npm install @tanstack/react-virtual
npm install @upstash/ratelimit @upstash/redis  # For rate limiting
```
