# Phase 2: Guest Identity & Persistence

> **Priority**: 🔴 Critical (Core UX improvement)  
> **Estimated Effort**: 3-4 hours  
> **Dependencies**: Phase 1 (Database Schema)

---

## 📋 Overview

Implement persistent guest identity using localStorage tokens. Return visitors skip the name input and see personalized content.

---

## 🎯 Tasks

### 2.1 Create Guest Identity Hook

Create a React hook to manage guest identity across the app:

```typescript
// hooks/useGuestIdentity.ts

interface GuestIdentity {
    guestId: string;
    guestToken: string;
    guestName: string;
    eventId: string;
}

export function useGuestIdentity(eventId: string) {
    // Check localStorage for existing identity
    // Validate token against database
    // Return identity or null
}
```

**Key Functions:**
- `getStoredIdentity()`: Read from localStorage
- `validateIdentity()`: Check token in database
- `createIdentity()`: Create new guest + store token
- `clearIdentity()`: Logout functionality

---

### 2.2 LocalStorage Schema

Define consistent storage format:

```typescript
// Key format: guestcap_identity_{eventId}
interface StoredIdentity {
    guest_id: string;
    guest_token: string;
    guest_name: string;
    event_id: string;
    created_at: string;
}
```

**Storage Keys:**
- `guestcap_identity_{eventId}` - Full identity object
- `guestcap_last_event` - Most recent event ID

---

### 2.3 Update Guest Entry Flow

Modify `/app/guest/[eventId]/page.tsx`:

```
FLOW:
1. Page loads
2. Check localStorage for identity
3. If found:
   a. Validate token against DB
   b. If valid → Show Mini Profile (skip name input)
   c. If invalid → Clear storage, show name input
4. If not found:
   a. Show name input form
   b. On submit → Create guest record
   c. Store identity in localStorage
   d. Navigate to Mini Profile
```

---

### 2.4 Create Guest API Routes

```typescript
// app/api/guest/validate/route.ts
// POST: Validate guest token
// Returns: { valid: boolean, guest?: Guest }

// app/api/guest/create/route.ts
// POST: Create new guest
// Body: { name: string, eventId: string }
// Returns: { guest: Guest, token: string }

// app/api/guest/update-seen/route.ts
// POST: Update last_seen timestamp
// Body: { guestToken: string }
```

---

### 2.5 Return Visit Detection

Add smart detection for returning guests:

```typescript
// On page load, check for identity
useEffect(() => {
    const identity = getStoredIdentity(eventId);
    
    if (identity) {
        // Validate with server
        validateIdentity(identity.guest_token)
            .then(valid => {
                if (valid) {
                    setIsReturningGuest(true);
                    updateLastSeen(identity.guest_token);
                } else {
                    clearIdentity(eventId);
                }
            });
    }
}, [eventId]);
```

---

## 🖼️ UI Components to Create

### 2.6 Welcome Back Component

For returning guests:

```tsx
// components/guest/WelcomeBack.tsx
<div className="text-center space-y-4">
    <h2 className="text-2xl font-bold">
        Welcome back, {guestName}! 👋
    </h2>
    <p className="text-foreground/60">
        You've already shared {uploadCount} memories!
    </p>
    <Button onClick={proceedToMenu}>
        Continue
    </Button>
    <button className="text-sm text-foreground/40">
        Not {guestName}? Use a different name
    </button>
</div>
```

---

## ✅ Verification

### Automated Tests
```bash
# Create test file: __tests__/guest-identity.test.ts
npm run test -- guest-identity
```

### Manual Testing
1. **New Guest Flow**:
   - Clear localStorage
   - Open `/guest/{eventId}`
   - Enter name → Should create guest and store token
   - Check localStorage for `guestcap_identity_{eventId}`

2. **Return Guest Flow**:
   - With existing identity, refresh page
   - Should skip name input
   - Should show "Welcome back" message

3. **Invalid Token**:
   - Manually corrupt token in localStorage
   - Refresh page
   - Should clear storage and show name input

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `hooks/useGuestIdentity.ts` | Identity management hook |
| CREATE | `lib/guest-storage.ts` | LocalStorage utilities |
| CREATE | `app/api/guest/validate/route.ts` | Token validation API |
| CREATE | `app/api/guest/create/route.ts` | Guest creation API |
| CREATE | `components/guest/WelcomeBack.tsx` | Return visitor UI |
| UPDATE | `app/guest/[eventId]/page.tsx` | Integrate identity flow |

---

## ⚠️ Edge Cases

- **Multiple devices**: Guest on different device needs to re-enter name
- **Cleared storage**: Treat as new guest
- **Expired events**: Show inactive message regardless of identity
