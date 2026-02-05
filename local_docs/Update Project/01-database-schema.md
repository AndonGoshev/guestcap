# Phase 1: Database Schema Updates

> **Priority**: 🔴 Critical (Foundation for all other phases)  
> **Estimated Effort**: 2-3 hours  
> **Dependencies**: None

---

## 📋 Overview

Update the Supabase database schema to support all new features: guest tokens, storage tracking, upload sessions, event lifecycle, and performance optimization.

---

## 🎯 Tasks

### 1.1 Update `guests` Table

Add columns for persistent identity and tracking:

```sql
ALTER TABLE guests ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT uuid_generate_v4();
ALTER TABLE guests ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(guest_token);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
```

**Purpose:**
- `guest_token`: Unique identifier stored in localStorage for return visits
- `last_seen`: Track guest activity for analytics

---

### 1.2 Update `events` Table

Add columns for storage management and event lifecycle:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 10240; -- 10GB default
ALTER TABLE events ADD COLUMN IF NOT EXISTS storage_used_mb NUMERIC(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS upload_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tier_plan TEXT DEFAULT 'essential';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index for active events lookup
CREATE INDEX IF NOT EXISTS idx_events_host_active ON events(host_id, is_active);
```

**Purpose:**
- `storage_limit_mb` / `storage_used_mb`: Enforce plan limits
- `upload_deadline`: Optional cutoff for guest uploads
- `tier_plan`: Track pricing tier (essential/wedding/pro)
- `is_active`: Allow hosts to deactivate events

---

### 1.3 Update `photos` Table

Add columns for upload tracking and multi-resolution support:

```sql
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS upload_session_id UUID;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, processing, ready, failed
ALTER TABLE photos ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Critical index for gallery performance at scale
CREATE INDEX IF NOT EXISTS idx_photos_event_created ON photos(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(event_id, status);
```

**Purpose:**
- `file_size_bytes`: Track storage usage
- `upload_session_id`: Link to chunked upload session
- `status`: Track processing pipeline state
- `preview_url` / `thumbnail_url`: Multi-resolution URLs
- Performance indexes for 10k+ photo events

---

### 1.4 Create `upload_sessions` Table (NEW)

Support resumable chunked uploads:

```sql
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    total_files INTEGER NOT NULL,
    uploaded_files INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    uploaded_chunks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed, expired, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- RLS
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests can create upload sessions" ON upload_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Guests can view own sessions" ON upload_sessions FOR SELECT USING (true);
CREATE POLICY "Guests can update own sessions" ON upload_sessions FOR UPDATE USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_upload_sessions_guest ON upload_sessions(guest_id, status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_event ON upload_sessions(event_id);
```

---

### 1.5 RLS Policy Updates

Ensure security for new columns:

```sql
-- Events: Only host can update storage/activation settings
CREATE POLICY "Hosts can update own events" ON events 
    FOR UPDATE USING (auth.uid() = host_id);

-- Photos: Allow status updates for processing pipeline
CREATE POLICY "System can update photo status" ON photos 
    FOR UPDATE USING (true);
```

---

## ✅ Verification

1. **Run migrations in Supabase SQL Editor**
2. **Verify tables**: Check that all columns exist in Table Editor
3. **Test indexes**: Run `EXPLAIN ANALYZE` on photo queries
4. **Verify RLS**: Test that policies work correctly

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `lib/db/migrations/001_schema_updates.sql` | Migration script |
| UPDATE | `local_docs/supabase_setup.md` | Update documentation |

---

## ⚠️ Breaking Changes

None - all changes are additive (new columns with defaults).
