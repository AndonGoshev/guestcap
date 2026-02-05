# Phase 7: Host Dashboard & Event Management

> **Priority**: 🟠 High (Host experience)  
> **Estimated Effort**: 5-6 hours  
> **Dependencies**: Phase 1 (Database Schema), Phase 4 (Storage Lifecycle)

---

## 📋 Overview

Enhance the host dashboard with event lifecycle controls, storage monitoring, and download capabilities.

---

## 🎯 New Host Features

1. **Event Activation Toggle** → Activate/Deactivate events
2. **Storage Dashboard** → Usage monitoring and limits
3. **Bulk Download** → ZIP download of all photos
4. **QR Code Management** → Generate and share event QR
5. **Guest Management** → View guest list and activity
6. **Plan Upgrade Prompts** → When approaching limits

---

## 🎯 Tasks

### 7.1 Event Settings Panel

Add settings to the event detail page:

```tsx
// components/dashboard/EventSettings.tsx

interface EventSettingsProps {
    event: Event;
    onUpdate: (updates: Partial<Event>) => Promise<void>;
}

export function EventSettings({ event, onUpdate }: EventSettingsProps) {
    return (
        <Card>
            <h3 className="font-bold text-lg mb-4">Event Settings</h3>
            
            {/* Active Toggle */}
            <div className="flex items-center justify-between py-4 border-b">
                <div>
                    <p className="font-medium">Event Active</p>
                    <p className="text-sm text-foreground/60">
                        When off, guests see "Event inactive" message
                    </p>
                </div>
                <Switch
                    checked={event.is_active}
                    onCheckedChange={(checked) => onUpdate({ is_active: checked })}
                />
            </div>
            
            {/* Upload Deadline */}
            <div className="py-4 border-b">
                <p className="font-medium mb-2">Upload Deadline</p>
                <p className="text-sm text-foreground/60 mb-2">
                    Optionally set a cutoff date for guest uploads
                </p>
                <input
                    type="datetime-local"
                    value={event.upload_deadline?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => onUpdate({ 
                        upload_deadline: e.target.value ? new Date(e.target.value) : null 
                    })}
                    className="..."
                />
            </div>
            
            {/* Danger Zone */}
            <div className="py-4 mt-4">
                <p className="font-medium text-red-500 mb-2">Danger Zone</p>
                <Button 
                    variant="destructive" 
                    onClick={handleDeleteEvent}
                >
                    Delete Event
                </Button>
            </div>
        </Card>
    );
}
```

---

### 7.2 Storage Dashboard Widget

Display storage usage with visual progress:

```tsx
// components/dashboard/StorageWidget.tsx

interface StorageWidgetProps {
    usedMb: number;
    limitMb: number;
    tierPlan: string;
}

export function StorageWidget({ usedMb, limitMb, tierPlan }: StorageWidgetProps) {
    const percentage = (usedMb / limitMb) * 100;
    const isNearLimit = percentage > 80;
    const isAtLimit = percentage >= 100;
    
    return (
        <Card>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Storage</h3>
                <span className="text-sm text-foreground/60">
                    {tierPlan.charAt(0).toUpperCase() + tierPlan.slice(1)} Plan
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-surface-end rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full transition-all",
                        isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-accent"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            
            {/* Stats */}
            <div className="flex justify-between mt-2 text-sm">
                <span>{formatSize(usedMb)} used</span>
                <span className="text-foreground/60">{formatSize(limitMb)} total</span>
            </div>
            
            {/* Warning */}
            {isNearLimit && !isAtLimit && (
                <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                    ⚠️ Approaching storage limit. <a href="/upgrade" className="underline">Upgrade plan</a>
                </div>
            )}
            
            {isAtLimit && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
                    🚫 Storage limit reached. New uploads blocked until you upgrade.
                </div>
            )}
        </Card>
    );
}

function formatSize(mb: number): string {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
}
```

---

### 7.3 Download All Photos

Add bulk download functionality:

```tsx
// components/dashboard/DownloadButton.tsx

export function DownloadButton({ eventId }: { eventId: string }) {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const handleDownload = async () => {
        setDownloading(true);
        
        try {
            const response = await fetch(`/api/download/event/${eventId}`);
            
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-photos-${eventId}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };
    
    return (
        <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing download...
                </>
            ) : (
                <>
                    <Download className="w-4 h-4 mr-2" />
                    Download All Photos
                </>
            )}
        </Button>
    );
}
```

---

### 7.4 QR Code Management

Generate and display shareable QR:

```tsx
// components/dashboard/QRCodeSection.tsx

import { QRCodeSVG } from 'qrcode.react';

export function QRCodeSection({ eventId }: { eventId: string }) {
    const guestUrl = `${window.location.origin}/guest/${eventId}`;
    
    const downloadQR = () => {
        const svg = document.getElementById('event-qr');
        // Convert SVG to PNG and download
    };
    
    const copyLink = async () => {
        await navigator.clipboard.writeText(guestUrl);
        toast.success('Link copied!');
    };
    
    return (
        <Card>
            <h3 className="font-bold text-lg mb-4">Share with Guests</h3>
            
            <div className="flex items-center gap-6">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG 
                        id="event-qr"
                        value={guestUrl}
                        size={150}
                        level="H"
                    />
                </div>
                
                {/* Actions */}
                <div className="flex-1 space-y-3">
                    <p className="text-sm text-foreground/60">
                        Guests scan this QR or use the link below to join and upload photos.
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={guestUrl}
                            readOnly
                            className="flex-1 px-3 py-2 bg-surface border rounded-lg text-sm"
                        />
                        <Button variant="ghost" size="sm" onClick={copyLink}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <Button variant="outline" onClick={downloadQR}>
                        <Download className="w-4 h-4 mr-2" />
                        Download QR
                    </Button>
                </div>
            </div>
        </Card>
    );
}
```

---

### 7.5 Guest List View

Show guests and their activity:

```tsx
// components/dashboard/GuestList.tsx

interface Guest {
    id: string;
    name: string;
    upload_count: number;
    last_seen: Date;
    created_at: Date;
}

export function GuestList({ eventId }: { eventId: string }) {
    const { guests, loading } = useEventGuests(eventId);
    
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Guests</h3>
                <span className="text-sm text-foreground/60">
                    {guests.length} total
                </span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {guests.map(guest => (
                    <div 
                        key={guest.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                {guest.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">{guest.name}</p>
                                <p className="text-xs text-foreground/50">
                                    Joined {formatRelative(guest.created_at)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">{guest.upload_count}</p>
                            <p className="text-xs text-foreground/50">photos</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
```

---

### 7.6 Update Event API

```typescript
// app/api/events/[eventId]/route.ts

export async function PATCH(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    const { eventId } = params;
    const body = await request.json();
    
    // Validate user is host
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: event } = await supabase
        .from('events')
        .select('host_id')
        .eq('id', eventId)
        .single();
    
    if (event?.host_id !== user?.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update event
    const { data, error } = await supabase
        .from('events')
        .update({
            is_active: body.is_active,
            upload_deadline: body.upload_deadline,
            // ... other fields
        })
        .eq('id', eventId)
        .select()
        .single();
    
    return Response.json(data);
}
```

---

## ✅ Verification

### Manual Testing

| Test Case | Expected Result |
|-----------|-----------------|
| Toggle event inactive | Guests see inactive message |
| Toggle event active | Guests can upload again |
| Storage near limit | Warning shown in dashboard |
| Click download all | ZIP file downloads |
| Copy guest link | Link in clipboard |
| View guest list | See all guests with stats |

---

## 📁 Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `components/dashboard/EventSettings.tsx` | Settings panel |
| CREATE | `components/dashboard/StorageWidget.tsx` | Storage display |
| CREATE | `components/dashboard/DownloadButton.tsx` | Bulk download |
| CREATE | `components/dashboard/QRCodeSection.tsx` | QR management |
| CREATE | `components/dashboard/GuestList.tsx` | Guest list view |
| CREATE | `app/api/events/[eventId]/route.ts` | Event update API |
| UPDATE | `app/dashboard/[eventId]/page.tsx` | Integrate new widgets |
