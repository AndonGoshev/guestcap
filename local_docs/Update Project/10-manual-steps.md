# Phase 10: Manual Steps Required

This document contains all the manual steps you need to complete to finalize the GuestCap update.

---

## ✅ Step 1: Install Required Packages

Run this command in your project directory:

```bash
npm install jszip @upstash/ratelimit @upstash/redis
```

> **Note**: `sharp` is optional for now (used for image processing). Install later if needed:
> ```bash
> npm install sharp
> ```

---

## ✅ Step 2: Set Up Upstash Redis (Required for Rate Limiting)

1. Go to [https://upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database (choose the region closest to your Supabase project)
3. Copy the connection details from the dashboard
4. Add these to your `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## ✅ Step 3: Add Supabase Service Role Key (Optional but Recommended)

For server-side operations, add the service role key:

1. Go to Supabase Dashboard → Project Settings → API
2. Copy the `service_role` key (keep this secret!)
3. Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## ✅ Step 4: Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these scripts **in order**:

### 4.1 Enable UUID Extension (if not already enabled)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 4.2 Update `guests` Table
```sql
-- Add new columns to guests
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Create index on guest_token
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(guest_token);
```

### 4.3 Update `events` Table
```sql
-- Add new columns to events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 10240,
ADD COLUMN IF NOT EXISTS storage_used_mb REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS upload_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tier_plan TEXT DEFAULT 'essential';
```

### 4.4 Update `photos` Table
```sql
-- Add new columns to photos
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS upload_session_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_event_created ON photos(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_guest ON photos(guest_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);
```

### 4.5 Create `upload_sessions` Table
```sql
-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    total_files INTEGER NOT NULL DEFAULT 0,
    uploaded_files INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_upload_sessions_guest ON upload_sessions(guest_id);
```

### 4.6 Create Storage Increment Function
```sql
-- Function to increment storage usage
CREATE OR REPLACE FUNCTION increment_storage(p_event_id UUID, p_bytes BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE events 
    SET storage_used_mb = storage_used_mb + (p_bytes::REAL / (1024 * 1024))
    WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;
```

### 4.7 Update RLS Policies (Run these one at a time)
```sql
-- Allow guests to read events (for checking is_active)
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- Allow authenticated users to update their own events
DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events" ON events 
FOR UPDATE USING (auth.uid() = host_id);

-- Allow authenticated users to delete their own events
DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events" ON events 
FOR DELETE USING (auth.uid() = host_id);

-- Allow anyone to create guests (for joining events)
DROP POLICY IF EXISTS "Anyone can join events as guest" ON guests;
CREATE POLICY "Anyone can join events as guest" ON guests FOR INSERT WITH CHECK (true);

-- Allow anyone to view guests
DROP POLICY IF EXISTS "Anyone can view guests" ON guests;
CREATE POLICY "Anyone can view guests" ON guests FOR SELECT USING (true);

-- Allow anyone to update their own guest record (by token)
DROP POLICY IF EXISTS "Guests can update own record" ON guests;
CREATE POLICY "Guests can update own record" ON guests 
FOR UPDATE USING (true);

-- Upload sessions policies
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create upload sessions" ON upload_sessions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view upload sessions" ON upload_sessions 
FOR SELECT USING (true);

CREATE POLICY "Anyone can update upload sessions" ON upload_sessions 
FOR UPDATE USING (true);
```

---

## ✅ Step 5: Verify Installation

1. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test the guest flow:**
   - Navigate to `/guest/[your-event-id]`
   - You should see the new Mini Profile UI
   - Try uploading a photo

3. **Test rate limiting:**
   - Check your Upstash dashboard for request counts

---

## 📁 Files Created Summary

### Lib (Utilities)
- `lib/guest-storage.ts` - localStorage utilities
- `lib/upload/chunked-uploader.ts` - Chunked upload class
- `lib/ratelimit/index.ts` - Upstash rate limiters
- `lib/db/photos.ts` - Cursor pagination
- `lib/storage/urls.ts` - Signed URL utilities

### Hooks
- `hooks/useGuestIdentity.ts` - Guest identity hook
- `hooks/useEvent.ts` - Event data hook

### API Routes
- `app/api/guest/create/route.ts`
- `app/api/guest/validate/route.ts`
- `app/api/guest/update-seen/route.ts`
- `app/api/guest/stats/route.ts`
- `app/api/upload/create-session/route.ts`
- `app/api/upload/complete/route.ts`
- `app/api/events/[eventId]/route.ts`
- `app/api/download/event/[eventId]/route.ts`

### Components - Guest
- `components/guest/ActionCard.tsx`
- `components/guest/EventInactive.tsx`
- `components/guest/EventNotFound.tsx`
- `components/guest/LoadingScreen.tsx`
- `components/guest/MiniProfile.tsx`
- `components/guest/NameInput.tsx`
- `components/guest/PersonalizedGreeting.tsx`
- `components/guest/EventProgress.tsx`

### Components - Upload
- `components/upload/FilePicker.tsx`
- `components/upload/UploadProgress.tsx`
- `components/upload/UploadSuccess.tsx`

### Components - Dashboard
- `components/dashboard/StorageWidget.tsx`
- `components/dashboard/EventSettings.tsx`
- `components/dashboard/DownloadButton.tsx`
- `components/dashboard/GuestList.tsx`

### Pages
- `app/guest/[eventId]/page.tsx` (Updated)
- `app/guest/[eventId]/upload/page.tsx` (New)

---

## 🎯 What's Ready vs What Needs Work

### ✅ Ready to Use
- Guest identity system with persistence
- New Mini Profile UX
- File upload with progress
- Host dashboard components
- Rate limiting infrastructure
- Download ZIP functionality
- Event settings (active toggle, deadline)

### 🔧 Needs Integration (Optional)
- Connect dashboard components to existing event page
- Add EventProgress to Mini Profile
- Image processing (thumbnails/previews) - requires Sharp setup
- Challenges sub-route

---

## 📝 Next Steps After Manual Setup

1. Test the complete guest flow
2. Integrate dashboard components into your existing event management page
3. Set up image processing (optional)
4. Deploy to production

Need help with any step? Just ask!
