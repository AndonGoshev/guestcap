# Phase 6: Engagement UX Layer

> **Priority**: 🟡 Medium (Conversion optimization)  
> **Estimated Effort**: 3-4 hours  
> **Dependencies**: Phase 2 (Guest Identity), Phase 5 (Guest UX Flow)

---

## 📋 Overview

Implement behavioral triggers and psychological patterns to increase guest participation and upload rates. This layer adds subtle engagement features without adding complexity.

---

## 🎯 Engagement Principles

1. **Personal Identity** → Creates ownership
2. **Social Proof** → Others are participating
3. **Emotional Feedback** → Positive reinforcement
4. **Soft Gamification** → Recognition, not competition
5. **Visibility** → "My photo is part of this"

---

## 🎯 Tasks

### 6.1 Personal Identity Enhancement

Enhance the Mini Profile greeting:

```tsx
// components/guest/PersonalizedGreeting.tsx

export function PersonalizedGreeting({ 
    guestName, 
    uploadCount,
    isReturning 
}: {
    guestName: string;
    uploadCount: number;
    isReturning: boolean;
}) {
    const getMessage = () => {
        if (isReturning) {
            return `Welcome back, ${guestName}! 👋`;
        }
        if (uploadCount === 0) {
            return `Hi ${guestName}! Ready to capture some memories?`;
        }
        if (uploadCount < 5) {
            return `Great start, ${guestName}! You've shared ${uploadCount} memories`;
        }
        return `You're on fire, ${guestName}! 🔥 ${uploadCount} memories shared`;
    };
    
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold">{getMessage()}</h1>
        </div>
    );
}
```

---

### 6.2 Social Proof - Event Progress Indicator

Show live event activity:

```tsx
// components/guest/EventProgress.tsx

interface EventProgressProps {
    totalPhotos: number;
    totalGuests: number;
    recentUploads?: number; // Last hour
}

export function EventProgress({ 
    totalPhotos, 
    totalGuests,
    recentUploads 
}: EventProgressProps) {
    return (
        <div className="flex items-center justify-center gap-4 text-sm text-foreground/60">
            <div className="flex items-center gap-1">
                <Camera className="w-4 h-4" />
                <span>{totalPhotos} photos</span>
            </div>
            <div className="w-1 h-1 bg-foreground/20 rounded-full" />
            <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{totalGuests} guests</span>
            </div>
            {recentUploads && recentUploads > 0 && (
                <>
                    <div className="w-1 h-1 bg-foreground/20 rounded-full" />
                    <div className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{recentUploads} this hour</span>
                    </div>
                </>
            )}
        </div>
    );
}
```

**Placement:**
- Mini Profile dashboard
- After upload success screen
- Challenge completion screen

---

### 6.3 Emotional Upload Feedback

Replace technical messages with emotional ones:

```tsx
// components/upload/UploadSuccess.tsx

const SUCCESS_MESSAGES = [
    "✨ Your photos are now part of {eventName}!",
    "🎉 Beautiful memories captured!",
    "💫 Added to the wedding story!",
    "📸 These moments are now saved forever!"
];

export function UploadSuccess({ 
    eventName,
    photoCount,
    thumbnails 
}: {
    eventName: string;
    photoCount: number;
    thumbnails: string[];
}) {
    const message = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
        .replace('{eventName}', eventName);
    
    return (
        <div className="text-center space-y-6 animate-in fade-in">
            {/* Success animation */}
            <div className="relative">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600 animate-in zoom-in" />
                </div>
                {/* Confetti or sparkle animation */}
            </div>
            
            {/* Message */}
            <div>
                <h2 className="text-xl font-bold">{message}</h2>
                <p className="text-foreground/60">
                    {photoCount} {photoCount === 1 ? 'photo' : 'photos'} uploaded
                </p>
            </div>
            
            {/* Preview of uploaded photos */}
            <div className="flex justify-center gap-2">
                {thumbnails.slice(0, 3).map((url, i) => (
                    <img 
                        key={i}
                        src={url} 
                        className="w-16 h-16 object-cover rounded-lg" 
                        alt="" 
                    />
                ))}
                {photoCount > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center">
                        <span className="text-sm font-medium">+{photoCount - 3}</span>
                    </div>
                )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={goBack}>
                    Done
                </Button>
                <Button onClick={uploadMore}>
                    Add more photos
                </Button>
            </div>
        </div>
    );
}
```

---

### 6.4 Soft Gamification (Challenge Badges)

Subtle recognition for challenge completion:

```tsx
// components/challenges/ChallengeBadge.tsx

interface ChallengeBadgeProps {
    completedCount: number;
    totalCount: number;
}

const BADGES = [
    { threshold: 1, name: 'First Shot', emoji: '📸' },
    { threshold: 3, name: 'Party Starter', emoji: '🎉' },
    { threshold: 5, name: 'Memory Maker', emoji: '✨' },
    { threshold: 10, name: 'Event Hero', emoji: '🦸' }
];

export function ChallengeBadge({ completedCount, totalCount }: ChallengeBadgeProps) {
    const currentBadge = BADGES.filter(b => completedCount >= b.threshold).pop();
    const nextBadge = BADGES.find(b => completedCount < b.threshold);
    
    if (!currentBadge && nextBadge) {
        return (
            <p className="text-sm text-foreground/60">
                Complete {nextBadge.threshold - completedCount} more challenge
                {nextBadge.threshold - completedCount > 1 ? 's' : ''} to earn "{nextBadge.name}"
            </p>
        );
    }
    
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent">
            <span>{currentBadge?.emoji}</span>
            <span className="text-sm font-medium">{currentBadge?.name}</span>
        </div>
    );
}
```

**Design Rules:**
- Subtle, not cartoonish
- Recognition, not competition
- No leaderboards
- No aggressive notifications

---

### 6.5 Visibility Feedback (Photo in Gallery)

After upload, briefly show their photo in the gallery:

```tsx
// After upload success, navigate to gallery with highlight
router.push(`/guest/${eventId}/gallery?highlight=${uploadedPhotoIds.join(',')}`);

// In gallery, highlight their photos
const highlightedIds = searchParams.get('highlight')?.split(',') || [];

<div className={cn(
    "relative",
    highlightedIds.includes(photo.id) && "ring-2 ring-accent ring-offset-2"
)}>
    <img src={photo.thumbnail_url} />
    {highlightedIds.includes(photo.id) && (
        <div className="absolute top-1 right-1 bg-accent text-white text-xs px-1 rounded">
            Your photo
        </div>
    )}
</div>
```

---

### 6.6 Return Visit Smart Message

Personalized message for returning guests:

```tsx
// components/guest/ReturnVisitMessage.tsx

export function ReturnVisitMessage({ 
    guestName,
    lastUploadDate,
    uploadCount 
}: {
    guestName: string;
    lastUploadDate?: Date;
    uploadCount: number;
}) {
    const getMessage = () => {
        if (!lastUploadDate) {
            return `Welcome back ${guestName}! You still have memories to share 😉`;
        }
        
        const daysSinceUpload = differenceInDays(new Date(), lastUploadDate);
        
        if (daysSinceUpload < 1) {
            return `Great job today, ${guestName}! Keep the photos coming 📸`;
        }
        if (daysSinceUpload < 7) {
            return `Welcome back ${guestName}! Got more photos from the event?`;
        }
        return `Hey ${guestName}! It's not too late to add more memories`;
    };
    
    return (
        <p className="text-foreground/60 text-center">{getMessage()}</p>
    );
}
```

---

## ✅ Verification

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| First visit | Welcome message without upload count |
| After 1 upload | "Great start" message |
| After 5+ uploads | "On fire" message |
| Complete 1 challenge | See progress toward badge |
| Complete 3 challenges | Earn "Party Starter" badge |
| Upload photos | See emotional success message |
| Return visit | Personalized welcome back message |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `components/guest/PersonalizedGreeting.tsx` | Dynamic greeting |
| CREATE | `components/guest/EventProgress.tsx` | Social proof stats |
| CREATE | `components/upload/UploadSuccess.tsx` | Emotional feedback |
| CREATE | `components/challenges/ChallengeBadge.tsx` | Soft gamification |
| CREATE | `components/guest/ReturnVisitMessage.tsx` | Return visitor UX |
| UPDATE | `app/guest/[eventId]/page.tsx` | Integrate components |
| UPDATE | `app/guest/[eventId]/gallery/page.tsx` | Photo highlighting |
