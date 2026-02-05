"use client";

import { useParams } from "next/navigation";
import { useGuestIdentity } from "@/hooks/useGuestIdentity";
import { useEvent } from "@/hooks/useEvent";
import { MiniProfile } from "@/components/guest/MiniProfile";
import { NameInput } from "@/components/guest/NameInput";
import { EventInactive } from "@/components/guest/EventInactive";
import { EventNotFound } from "@/components/guest/EventNotFound";
import { LoadingScreen } from "@/components/guest/LoadingScreen";

export default function GuestEntryPage() {
    const { eventId } = useParams() as { eventId: string };

    const {
        identity,
        loading: identityLoading,
        isReturningGuest,
        createGuest,
        logout
    } = useGuestIdentity(eventId);

    const {
        event,
        stats,
        loading: eventLoading
    } = useEvent(eventId);

    // Loading state
    if (identityLoading || eventLoading) {
        return <LoadingScreen />;
    }

    // Event not found
    if (!event) {
        return <EventNotFound />;
    }

    // Event inactive
    if (event.is_active === false) {
        return <EventInactive eventName={event.name} />;
    }

    // Check upload deadline
    if (event.upload_deadline) {
        const deadline = new Date(event.upload_deadline);
        if (deadline < new Date()) {
            return <EventInactive eventName={event.name} />;
        }
    }

    // New guest - show name input
    if (!identity) {
        return (
            <NameInput
                eventName={event.name}
                eventImageUrl={event.event_image_url}
                onSubmit={async (name) => {
                    await createGuest(name);
                }}
                isLoading={identityLoading}
            />
        );
    }

    // Returning guest or just created - show mini profile
    return (
        <MiniProfile
            guestName={identity.guestName}
            uploadCount={identity.uploadCount || 0}
            eventName={event.name}
            eventImageUrl={event.event_image_url}
            eventStats={{
                totalPhotos: stats.totalPhotos,
                totalGuests: stats.totalGuests,
            }}
            challengeCount={stats.challengeCount}
            isReturningGuest={isReturningGuest}
            onLogout={logout}
        />
    );
}
