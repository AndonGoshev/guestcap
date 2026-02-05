# Phase 3: Chunked Upload System

> **Priority**: 🔴 Critical (Core functionality)  
> **Estimated Effort**: 6-8 hours  
> **Dependencies**: Phase 1 (Database Schema)

---

## 📋 Overview

Implement resumable chunked uploads for reliable bulk photo uploads. Files are split client-side and uploaded directly to Supabase Storage, with server coordination for session management.

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Select files                                                 │
│  2. Request upload session (→ API)                              │
│  3. Split files into chunks (2MB each)                          │
│  4. Upload chunks directly to Supabase Storage                  │
│  5. Report completion (→ API)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API                                 │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/upload/create-session                                │
│  POST /api/upload/complete                                      │
│  GET  /api/upload/session/[id]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  Bucket: event-photos                                            │
│  Path: /events/{eventId}/originals/{photoId}                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tasks

### 3.1 Create Upload Session API

```typescript
// app/api/upload/create-session/route.ts

interface CreateSessionRequest {
    eventId: string;
    guestToken: string;
    files: Array<{
        name: string;
        size: number;
        type: string;
    }>;
}

interface CreateSessionResponse {
    sessionId: string;
    chunkSize: number; // 2MB
    files: Array<{
        fileId: string;
        uploadUrl: string; // Signed URL for direct upload
        chunks: number;
    }>;
}
```

**Logic:**
1. Validate guest token
2. Check event storage limits
3. Create `upload_session` record
4. Generate signed URLs for each file
5. Return session details

---

### 3.2 Implement Chunk Upload Logic (Client)

```typescript
// lib/upload/chunked-uploader.ts

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export class ChunkedUploader {
    private sessionId: string;
    private files: File[];
    private onProgress: (progress: UploadProgress) => void;
    
    async upload() {
        for (const file of this.files) {
            const chunks = this.splitIntoChunks(file);
            
            for (let i = 0; i < chunks.length; i++) {
                await this.uploadChunk(chunks[i], i);
                this.reportProgress();
            }
        }
        
        await this.completeUpload();
    }
    
    private splitIntoChunks(file: File): Blob[] {
        const chunks: Blob[] = [];
        let offset = 0;
        
        while (offset < file.size) {
            chunks.push(file.slice(offset, offset + CHUNK_SIZE));
            offset += CHUNK_SIZE;
        }
        
        return chunks;
    }
    
    private async uploadChunk(chunk: Blob, index: number) {
        // Upload directly to Supabase Storage
        // Retry logic with exponential backoff
    }
}
```

---

### 3.3 Progress Tracking UI

```typescript
// components/upload/UploadProgress.tsx

interface UploadProgress {
    totalFiles: number;
    completedFiles: number;
    currentFile: string;
    currentFileProgress: number; // 0-100
    overallProgress: number; // 0-100
    bytesUploaded: number;
    bytesTotal: number;
    estimatedTimeRemaining: number; // seconds
}
```

**UI Elements:**
- Overall progress bar
- Current file indicator
- "X of Y files uploaded"
- Estimated time remaining
- Pause/Resume button
- Cancel button

---

### 3.4 Complete Upload API

```typescript
// app/api/upload/complete/route.ts

interface CompleteRequest {
    sessionId: string;
    guestToken: string;
}

// Server-side logic:
// 1. Validate all chunks received
// 2. Assemble file if chunked storage used
// 3. Create photo records in database
// 4. Update event storage_used_mb
// 5. Mark session as completed
// 6. Trigger processing pipeline (previews/thumbnails)
```

---

### 3.5 Resume Interrupted Uploads

Handle browser close, network issues:

```typescript
// On page load, check for incomplete sessions
useEffect(() => {
    const pendingSessions = localStorage.getItem('guestcap_pending_uploads');
    
    if (pendingSessions) {
        const sessions = JSON.parse(pendingSessions);
        
        // Show "Resume upload?" prompt
        setShowResumePrompt(true);
    }
}, []);

// Resume logic:
// 1. Fetch session status from API
// 2. Identify uploaded vs pending chunks
// 3. Continue from last successful chunk
```

---

### 3.6 Error Handling & Retry

```typescript
// lib/upload/retry-handler.ts

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 5000]; // Exponential backoff

async function uploadWithRetry(chunk: Blob, attempt = 0): Promise<void> {
    try {
        await uploadChunk(chunk);
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAYS[attempt]);
            return uploadWithRetry(chunk, attempt + 1);
        }
        throw new UploadError('Failed after max retries', error);
    }
}
```

---

## 🔐 Security Considerations

1. **Signed URLs**: Use short-lived (15 min) signed URLs
2. **Size validation**: Enforce per-file and total limits
3. **Type validation**: Only allow image types (jpg, png, heic, webp)
4. **Rate limiting**: Max 10 concurrent chunk uploads
5. **Token validation**: Always verify guest token

---

## ✅ Verification

### Automated Tests
```bash
# Test chunked upload logic
npm run test -- chunked-uploader

# Test session management
npm run test -- upload-session
```

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| Upload 5 small files (< 2MB each) | Single chunk per file, no splitting |
| Upload 1 large file (50MB) | Split into 25 chunks, progress updates |
| Close browser mid-upload | Resume prompt on return |
| Network disconnect | Retry with backoff, resume capability |
| Exceed storage limit | Warning before upload starts |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `lib/upload/chunked-uploader.ts` | Core upload class |
| CREATE | `lib/upload/retry-handler.ts` | Retry logic |
| CREATE | `app/api/upload/create-session/route.ts` | Session creation |
| CREATE | `app/api/upload/complete/route.ts` | Upload completion |
| CREATE | `app/api/upload/session/[id]/route.ts` | Session status |
| CREATE | `components/upload/UploadProgress.tsx` | Progress UI |
| CREATE | `components/upload/ResumePrompt.tsx` | Resume dialog |
| CREATE | `hooks/useUpload.ts` | Upload state management |

---

## ⚠️ Performance Notes

- **Parallel uploads**: Upload up to 3 chunks simultaneously
- **Memory management**: Don't load all files into memory at once
- **Worker threads**: Consider Web Workers for chunking large files
