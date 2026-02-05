/**
 * Guest Storage Utilities
 * Manages guest identity persistence in localStorage
 */

export interface StoredGuestIdentity {
    guestId: string;
    guestToken: string;
    guestName: string;
    eventId: string;
    createdAt: string;
    uploadCount?: number;
}

const STORAGE_PREFIX = 'guestcap_identity_';
const LAST_EVENT_KEY = 'guestcap_last_event';

/**
 * Get stored identity for a specific event
 */
export function getStoredIdentity(eventId: string): StoredGuestIdentity | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
        if (!stored) return null;

        const identity = JSON.parse(stored) as StoredGuestIdentity;

        // Validate structure
        if (!identity.guestId || !identity.guestToken || !identity.guestName) {
            console.warn('Invalid stored identity structure, clearing...');
            clearIdentity(eventId);
            return null;
        }

        return identity;
    } catch (error) {
        console.error('Error reading guest identity:', error);
        return null;
    }
}

/**
 * Store guest identity for an event
 */
export function storeIdentity(identity: StoredGuestIdentity): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(
            `${STORAGE_PREFIX}${identity.eventId}`,
            JSON.stringify(identity)
        );
        localStorage.setItem(LAST_EVENT_KEY, identity.eventId);
    } catch (error) {
        console.error('Error storing guest identity:', error);
    }
}

/**
 * Clear identity for a specific event
 */
export function clearIdentity(eventId: string): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${eventId}`);

        // Also clear legacy storage keys for backwards compatibility
        localStorage.removeItem(`gc_guest_${eventId}`);
        localStorage.removeItem(`gc_guest_name_${eventId}`);
    } catch (error) {
        console.error('Error clearing guest identity:', error);
    }
}

/**
 * Update upload count for stored identity
 */
export function updateUploadCount(eventId: string, count: number): void {
    const identity = getStoredIdentity(eventId);
    if (identity) {
        identity.uploadCount = count;
        storeIdentity(identity);
    }
}

/**
 * Get last visited event ID
 */
export function getLastEventId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_EVENT_KEY);
}

/**
 * Migrate from legacy storage format (gc_guest_*) to new format
 */
export function migrateLegacyStorage(eventId: string): StoredGuestIdentity | null {
    if (typeof window === 'undefined') return null;

    try {
        const legacyGuestId = localStorage.getItem(`gc_guest_${eventId}`);
        const legacyGuestName = localStorage.getItem(`gc_guest_name_${eventId}`);

        if (legacyGuestId && legacyGuestName) {
            // We don't have a token from legacy, so we'll need to validate with server
            // Return partial identity that needs token refresh
            return {
                guestId: legacyGuestId,
                guestToken: '', // Needs to be fetched from server
                guestName: legacyGuestName,
                eventId: eventId,
                createdAt: new Date().toISOString(),
            };
        }

        return null;
    } catch (error) {
        console.error('Error migrating legacy storage:', error);
        return null;
    }
}
