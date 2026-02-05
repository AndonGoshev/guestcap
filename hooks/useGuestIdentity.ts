"use client";

import { useState, useEffect, useCallback } from "react";
import {
    StoredGuestIdentity,
    getStoredIdentity,
    storeIdentity,
    clearIdentity,
    migrateLegacyStorage,
    updateUploadCount,
} from "@/lib/guest-storage";

interface GuestIdentityState {
    identity: StoredGuestIdentity | null;
    loading: boolean;
    error: string | null;
    isReturningGuest: boolean;
}

interface UseGuestIdentityReturn extends GuestIdentityState {
    createGuest: (name: string) => Promise<StoredGuestIdentity | null>;
    logout: () => void;
    refreshUploadCount: () => Promise<void>;
}

export function useGuestIdentity(eventId: string): UseGuestIdentityReturn {
    const [state, setState] = useState<GuestIdentityState>({
        identity: null,
        loading: true,
        error: null,
        isReturningGuest: false,
    });

    // Check for existing identity on mount
    useEffect(() => {
        async function checkIdentity() {
            setState(prev => ({ ...prev, loading: true, error: null }));

            try {
                // First check new storage format
                let stored = getStoredIdentity(eventId);

                // If not found, try migrating from legacy
                if (!stored) {
                    stored = migrateLegacyStorage(eventId);
                }

                if (stored) {
                    // Validate token with server
                    const isValid = await validateToken(stored.guestToken, stored.guestId, eventId);

                    if (isValid) {
                        // Update last seen on server
                        await updateLastSeen(stored.guestToken);

                        setState({
                            identity: stored,
                            loading: false,
                            error: null,
                            isReturningGuest: true,
                        });
                        return;
                    } else {
                        // Token invalid, clear storage
                        clearIdentity(eventId);
                    }
                }

                // No valid identity found
                setState({
                    identity: null,
                    loading: false,
                    error: null,
                    isReturningGuest: false,
                });
            } catch (error) {
                console.error("Error checking guest identity:", error);
                setState({
                    identity: null,
                    loading: false,
                    error: "Failed to verify identity",
                    isReturningGuest: false,
                });
            }
        }

        checkIdentity();
    }, [eventId]);

    // Create new guest
    const createGuest = useCallback(async (name: string): Promise<StoredGuestIdentity | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await fetch("/api/guest/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), eventId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create guest");
            }

            const data = await response.json();

            const newIdentity: StoredGuestIdentity = {
                guestId: data.guest.id,
                guestToken: data.guest.guest_token,
                guestName: data.guest.name,
                eventId: eventId,
                createdAt: new Date().toISOString(),
                uploadCount: 0,
            };

            storeIdentity(newIdentity);

            setState({
                identity: newIdentity,
                loading: false,
                error: null,
                isReturningGuest: false,
            });

            return newIdentity;
        } catch (error: any) {
            console.error("Error creating guest:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || "Failed to create guest",
            }));
            return null;
        }
    }, [eventId]);

    // Logout (clear identity)
    const logout = useCallback(() => {
        clearIdentity(eventId);
        setState({
            identity: null,
            loading: false,
            error: null,
            isReturningGuest: false,
        });
    }, [eventId]);

    // Refresh upload count from server
    const refreshUploadCount = useCallback(async () => {
        if (!state.identity) return;

        try {
            const response = await fetch(
                `/api/guest/stats?guestId=${state.identity.guestId}&eventId=${eventId}`
            );

            if (response.ok) {
                const data = await response.json();
                updateUploadCount(eventId, data.uploadCount);
                setState(prev => ({
                    ...prev,
                    identity: prev.identity
                        ? { ...prev.identity, uploadCount: data.uploadCount }
                        : null,
                }));
            }
        } catch (error) {
            console.error("Error refreshing upload count:", error);
        }
    }, [eventId, state.identity]);

    return {
        ...state,
        createGuest,
        logout,
        refreshUploadCount,
    };
}

// Helper functions for API calls
async function validateToken(token: string, guestId: string, eventId: string): Promise<boolean> {
    if (!token) return false;

    try {
        const response = await fetch("/api/guest/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestToken: token, guestId, eventId }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.valid === true;
    } catch {
        return false;
    }
}

async function updateLastSeen(token: string): Promise<void> {
    try {
        await fetch("/api/guest/update-seen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestToken: token }),
        });
    } catch (error) {
        console.error("Error updating last seen:", error);
    }
}
