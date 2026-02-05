# Phase 9: Future Scaling (AI & Advanced Features)

> **Priority**: 🟢 Low (Future roadmap)  
> **Estimated Effort**: Variable  
> **Dependencies**: Phases 1-8 complete

---

## 📋 Overview

This phase outlines future enhancements after the core platform is stable. These features add significant value but are not required for MVP launch.

---

## 🎯 Future Features

### 9.1 AI Auto-Selection of Best Photos

Automatically highlight the best photos from each event using AI.

**How it works:**
1. After upload processing, queue photos for AI analysis
2. Use vision model to score photos on:
   - Technical quality (blur, exposure, composition)
   - Emotional content (smiles, engagement)
   - Uniqueness (avoid similar shots)
3. Tag top 10-20% as "Featured"
4. Show "AI Picks" section in gallery

**Technical approach:**
```typescript
// lib/ai/photo-scorer.ts

interface PhotoScore {
    technical: number;     // 0-100
    emotional: number;     // 0-100
    uniqueness: number;    // 0-100
    overall: number;       // Weighted average
}

async function scorePhoto(imageUrl: string): Promise<PhotoScore> {
    // Option 1: OpenAI Vision API
    // Option 2: Google Cloud Vision
    // Option 3: Custom model (if volume justifies)
}
```

**Database additions:**
```sql
ALTER TABLE photos ADD COLUMN ai_score NUMERIC(5,2);
ALTER TABLE photos ADD COLUMN is_featured BOOLEAN DEFAULT false;
CREATE INDEX idx_photos_featured ON photos(event_id, is_featured) WHERE is_featured = true;
```

---

### 9.2 Duplicate Detection

Prevent the same photo from being uploaded multiple times.

**How it works:**
1. Generate perceptual hash (pHash) for each photo during processing
2. Before marking as "ready", check for similar hashes in event
3. If duplicate found:
   - Skip silently, OR
   - Notify guest "This photo may already exist"

**Technical approach:**
```typescript
// lib/processing/dedup.ts

import { imagehash } from 'image-hash';

async function getPerceptualHash(imageBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        imagehash.hash(imageBuffer, 16, 'binary', (err, hash) => {
            if (err) reject(err);
            else resolve(hash);
        });
    });
}

function hammingDistance(hash1: string, hash2: string): number {
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
}

// Similarity threshold: 10% difference = likely duplicate
const DUPLICATE_THRESHOLD = 16 * 0.1; // 1.6 bits
```

**Database additions:**
```sql
ALTER TABLE photos ADD COLUMN phash TEXT;
CREATE INDEX idx_photos_phash ON photos(event_id, phash);
```

---

### 9.3 Auto Wedding Album Builder

Generate a curated photo album from event photos.

**How it works:**
1. Host clicks "Generate Album"
2. AI selects and orders best photos
3. Groups by timeline/activity
4. Generates PDF or printable format

**Page structure:**
- Cover: Event name, date, couple names
- Timeline sections: Ceremony, Reception, Party
- Feature pages: Key moments (first dance, cake cutting)
- Guest collage pages

**Technical approach:**
```typescript
// lib/album/generator.ts

interface AlbumPage {
    type: 'cover' | 'timeline' | 'feature' | 'collage';
    photos: Photo[];
    layout: 'single' | 'grid-2' | 'grid-4' | 'collage';
    caption?: string;
}

async function generateAlbum(eventId: string): Promise<AlbumPage[]> {
    // 1. Get all featured/high-scored photos
    // 2. Cluster by time (detect ceremony, reception, etc.)
    // 3. Select best from each cluster
    // 4. Generate page layouts
    // 5. Return album structure
}
```

---

### 9.4 Face Recognition & Tagging

Group photos by the people in them.

**How it works:**
1. Detect faces in photos during processing
2. Cluster similar faces together
3. Allow hosts/guests to name face clusters
4. Enable "Find photos of me" for guests

**Privacy considerations:**
- Opt-in only
- Face data never leaves platform
- Easy deletion of face data
- GDPR compliant

---

### 9.5 Real-Time Gallery Updates

Live updates as new photos are uploaded.

**How it works:**
1. Use Supabase Realtime subscriptions
2. When photos marked "ready", broadcast to gallery viewers
3. New photos animate in at top of gallery

```typescript
// hooks/useRealtimePhotos.ts

export function useRealtimePhotos(eventId: string) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    
    useEffect(() => {
        const channel = supabase
            .channel(`photos:${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'photos',
                    filter: `event_id=eq.${eventId}`
                },
                (payload) => {
                    if (payload.new.status === 'ready') {
                        setPhotos(prev => [payload.new as Photo, ...prev]);
                    }
                }
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);
    
    return photos;
}
```

---

### 9.6 Video Support

Allow short video clips (10-30 seconds).

**Considerations:**
- Much larger storage requirements
- Video processing pipeline (ffmpeg)
- Thumbnail generation from video
- Playback optimization (HLS/DASH)

**Storage impact:**
- 30s 1080p video ≈ 50-100MB
- Need separate storage quotas for video
- Consider video-specific pricing tier

---

### 9.7 Slideshow Mode

Auto-playing slideshow for event displays.

**Features:**
- Ken Burns effect on photos
- Background music option
- Configurable timing
- Fullscreen mode
- Live photo inclusion as uploaded

---

## 📅 Suggested Roadmap

| Quarter | Features |
|---------|----------|
| Q2 2026 | Duplicate detection, Real-time updates |
| Q3 2026 | AI auto-selection, Slideshow mode |
| Q4 2026 | Album builder, Video support |
| Q1 2027 | Face recognition (if demand exists) |

---

## 💡 Implementation Notes

**AI Features:**
- Start with OpenAI/Google APIs
- Move to custom models only if volume justifies
- Always have human override capability

**Performance:**
- All AI processing is background/async
- Never block upload completion
- Queue-based processing with priority

**Pricing:**
- AI features may require higher tier
- Consider per-use pricing for expensive operations
- Album generation could be one-time purchase

---

## 📁 Files to Create (Future)

| File | Feature |
|------|---------|
| `lib/ai/photo-scorer.ts` | AI scoring |
| `lib/ai/face-detector.ts` | Face recognition |
| `lib/processing/dedup.ts` | Duplicate detection |
| `lib/album/generator.ts` | Album creation |
| `lib/video/processor.ts` | Video processing |
| `components/gallery/Slideshow.tsx` | Slideshow UI |
| `hooks/useRealtimePhotos.ts` | Live updates |
