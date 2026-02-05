# Phase 5: Guest UX Flow Redesign

> **Priority**: 🟠 High (User experience)  
> **Estimated Effort**: 4-5 hours  
> **Dependencies**: Phase 2 (Guest Identity)

---

## 📋 Overview

Redesign the guest experience to replace auto-camera with a "Mini Profile" dashboard. Guests see their identity, upload options, and challenges in a clear menu.

---

## 🎯 New Guest Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: QR SCAN                               │
│                                                                  │
│  Guest opens: /guest/[eventId]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 2: IDENTITY CHECK                           │
│                                                                  │
│  Check localStorage for guest_token                             │
│  ├─ Found → Validate with DB → Step 4 (Mini Profile)            │
│  └─ Not found → Step 3 (Name Input)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STEP 3: NAME INPUT                              │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │        Welcome to Sarah & Mike's            │                │
│  │              Wedding! 💍                     │                │
│  │                                             │                │
│  │    Enter your name to start sharing         │                │
│  │                                             │                │
│  │    ┌─────────────────────────────┐          │                │
│  │    │  Your name                  │          │                │
│  │    └─────────────────────────────┘          │                │
│  │                                             │                │
│  │         [ Continue → ]                      │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 4: MINI PROFILE DASHBOARD                    │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │   👋 Hi Alex!                               │                │
│  │   You've shared 3 memories                  │                │
│  │                                             │                │
│  │   ┌─────────────────────────────────────┐   │                │
│  │   │ 📁 Send photos from phone           │   │                │
│  │   │    Upload from your gallery         │   │                │
│  │   └─────────────────────────────────────┘   │                │
│  │                                             │                │
│  │   ┌─────────────────────────────────────┐   │                │
│  │   │ 📷 Take photos now                  │   │                │
│  │   │    Open camera                      │   │                │
│  │   └─────────────────────────────────────┘   │                │
│  │                                             │                │
│  │   ┌─────────────────────────────────────┐   │                │
│  │   │ ⭐ Challenges (3 available)         │   │                │
│  │   │    Complete fun photo tasks         │   │                │
│  │   └─────────────────────────────────────┘   │                │
│  │                                             │                │
│  │   ─────────────────────────────────────     │                │
│  │   📊 Event: 243 photos from 17 guests       │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tasks

### 5.1 Create Mini Profile Component

```tsx
// components/guest/MiniProfile.tsx

interface MiniProfileProps {
    guestName: string;
    uploadCount: number;
    eventName: string;
    eventStats: {
        totalPhotos: number;
        totalGuests: number;
    };
    challengeCount: number;
}

export function MiniProfile({
    guestName,
    uploadCount,
    eventName,
    eventStats,
    challengeCount
}: MiniProfileProps) {
    return (
        <div className="min-h-screen bg-background p-6">
            {/* Greeting */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">
                    👋 Hi {guestName}!
                </h1>
                <p className="text-foreground/60">
                    You've shared {uploadCount} {uploadCount === 1 ? 'memory' : 'memories'}
                </p>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-4 max-w-sm mx-auto">
                <ActionCard
                    icon={<Folder />}
                    title="Send photos from phone"
                    subtitle="Upload from your gallery"
                    onClick={() => router.push('/guest/{eventId}/upload')}
                />
                
                <ActionCard
                    icon={<Camera />}
                    title="Take photos now"
                    subtitle="Open camera"
                    onClick={() => router.push('/guest/{eventId}/camera')}
                />
                
                <ActionCard
                    icon={<Star />}
                    title={`Challenges (${challengeCount} available)`}
                    subtitle="Complete fun photo tasks"
                    onClick={() => router.push('/guest/{eventId}/challenges')}
                    highlighted
                />
            </div>
            
            {/* Event Stats */}
            <div className="mt-8 text-center text-sm text-foreground/50">
                📊 {eventStats.totalPhotos} photos from {eventStats.totalGuests} guests
            </div>
        </div>
    );
}
```

---

### 5.2 Create Action Card Component

```tsx
// components/guest/ActionCard.tsx

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    highlighted?: boolean;
}

export function ActionCard({
    icon,
    title,
    subtitle,
    onClick,
    highlighted
}: ActionCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-4 rounded-2xl border text-left",
                "flex items-center gap-4",
                "transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                highlighted 
                    ? "bg-accent/10 border-accent hover:bg-accent/20" 
                    : "bg-surface border-border hover:border-accent/50"
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                highlighted ? "bg-accent text-white" : "bg-surface-end"
            )}>
                {icon}
            </div>
            <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-foreground/50">{subtitle}</p>
            </div>
            <ChevronRight className="ml-auto text-foreground/30" />
        </button>
    );
}
```

---

### 5.3 Inactive Event Screen

When event is deactivated:

```tsx
// components/guest/EventInactive.tsx

export function EventInactive({ eventName }: { eventName: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h1 className="text-xl font-bold mb-2">
                    Event Inactive
                </h1>
                <p className="text-foreground/60">
                    This event is currently inactive. Please contact the host for more information.
                </p>
            </div>
        </div>
    );
}
```

---

### 5.4 Update Guest Page Router

```tsx
// app/guest/[eventId]/page.tsx

export default function GuestPage({ params }: { params: { eventId: string } }) {
    const { eventId } = params;
    const { identity, loading: identityLoading } = useGuestIdentity(eventId);
    const { event, loading: eventLoading } = useEvent(eventId);
    
    // Loading state
    if (identityLoading || eventLoading) {
        return <LoadingScreen />;
    }
    
    // Event not found
    if (!event) {
        return <EventNotFound />;
    }
    
    // Event inactive
    if (!event.is_active) {
        return <EventInactive eventName={event.name} />;
    }
    
    // New guest - show name input
    if (!identity) {
        return <NameInput eventId={eventId} eventName={event.name} />;
    }
    
    // Returning guest - show mini profile
    return (
        <MiniProfile
            guestName={identity.guestName}
            uploadCount={identity.uploadCount}
            eventName={event.name}
            eventStats={event.stats}
            challengeCount={event.challengeCount}
        />
    );
}
```

---

### 5.5 Create Sub-routes

| Route | Purpose |
|-------|---------|
| `/guest/[eventId]` | Mini Profile (main entry) |
| `/guest/[eventId]/upload` | Gallery upload interface |
| `/guest/[eventId]/camera` | Camera capture |
| `/guest/[eventId]/challenges` | Challenge list |
| `/guest/[eventId]/challenges/[challengeId]` | Single challenge |

---

## ✅ Verification

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| New guest visits | Name input screen shown |
| Enter name, submit | Redirected to Mini Profile |
| Return visit (same device) | Skips name, shows Mini Profile with greeting |
| Inactive event | Shows inactive message |
| Click "Send photos" | Opens upload interface |
| Click "Take photos" | Opens camera |
| Click "Challenges" | Shows challenge list |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `components/guest/MiniProfile.tsx` | Main guest dashboard |
| CREATE | `components/guest/ActionCard.tsx` | Action button component |
| CREATE | `components/guest/EventInactive.tsx` | Inactive event screen |
| CREATE | `components/guest/NameInput.tsx` | Name entry form |
| CREATE | `app/guest/[eventId]/upload/page.tsx` | Upload interface |
| CREATE | `app/guest/[eventId]/camera/page.tsx` | Camera interface |
| UPDATE | `app/guest/[eventId]/page.tsx` | Main routing logic |
