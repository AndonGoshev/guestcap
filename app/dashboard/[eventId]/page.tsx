"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEvents } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import { useChallenges } from "@/hooks/useChallenges";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ArrowLeft, Share2, Folder, Image as ImageIcon, Sparkles, Power, Download, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function EventDashboard() {
    const { eventId } = useParams() as { eventId: string };
    const router = useRouter();
    const { getEvent, toggleEventActive, deleteEvent } = useEvents();
    const event = getEvent(eventId);
    const { photos } = usePhotos(eventId);
    const { challenges } = useChallenges(eventId);
    const { t } = useLanguage();

    const [baseUrl, setBaseUrl] = useState("");
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Set initial base url
    if (typeof window !== 'undefined' && !baseUrl) {
        setBaseUrl(window.location.origin);
    }

    if (!event) return <div className="p-12">{t.eventNotFound}</div>;

    const eventUrl = `${baseUrl}/guest/${eventId}`;
    const isActive = event.is_active !== false;

    const handleToggleActive = async () => {
        setIsToggling(true);
        await toggleEventActive(eventId);
        setIsToggling(false);
    };

    const handleDownload = async () => {
        if (photos.length === 0) {
            setDownloadError("No photos to download");
            return;
        }

        setIsDownloading(true);
        setDownloadError(null);
        setDownloadProgress(0);
        setDownloadStatus("Starting download...");

        try {
            const response = await fetch(`/api/download/event/${eventId}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Download failed");
            }

            const contentLength = response.headers.get("Content-Length");
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

            const contentDisposition = response.headers.get("Content-Disposition");
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || `${event.name}-photos.zip`;

            // If we have content length, track progress
            if (totalBytes > 0 && response.body) {
                const reader = response.body.getReader();
                const chunks: Uint8Array[] = [];
                let receivedBytes = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    chunks.push(value);
                    receivedBytes += value.length;

                    const progress = Math.round((receivedBytes / totalBytes) * 100);
                    setDownloadProgress(progress);
                    const mbDownloaded = (receivedBytes / (1024 * 1024)).toFixed(1);
                    const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
                    setDownloadStatus(`Downloading: ${mbDownloaded} MB / ${mbTotal} MB`);
                }

                const blob = new Blob(chunks as BlobPart[]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Fallback: no progress tracking
                setDownloadStatus("Preparing ZIP file...");
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            setDownloadProgress(100);
            setDownloadStatus("Download complete!");
        } catch (err: any) {
            console.error("Download error:", err);
            setDownloadError(err.message || "Failed to download");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await deleteEvent(eventId);
        setIsDeleting(false);

        if (success) {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="pl-0">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.dashboard}
                        </Button>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <LanguageToggle />
                        <span className="text-sm text-foreground/50">ID: {eventId.slice(0, 8)}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Main Info */}
                    <div className="flex-1 space-y-8 w-full">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-bold text-foreground">{event.name}</h1>
                                {/* Event Active Toggle */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleToggleActive}
                                        disabled={isToggling}
                                        className={`
                                            relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                                            ${isActive ? 'bg-green-500' : 'bg-gray-300'}
                                            ${isToggling ? 'opacity-50' : ''}
                                        `}
                                    >
                                        <span
                                            className={`
                                                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                                                ${isActive ? 'translate-x-5' : 'translate-x-0'}
                                            `}
                                        />
                                    </button>
                                    <span className={`text-sm font-medium ${isActive ? 'text-green-500' : 'text-foreground/40'}`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-foreground/60">{t.createdOn} {new Date(event.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Folders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href={`/dashboard/${eventId}/photos`}>
                                <Card className="h-40 flex flex-col justify-between hover:border-accent transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-surface-end rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-foreground/70" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">{t.allPhotos}</h3>
                                        <p className="text-sm text-foreground/40">{photos.length} {t.photos}</p>
                                    </div>
                                </Card>
                            </Link>

                            <Link href={`/dashboard/${eventId}/challenges`}>
                                <Card className="h-40 flex flex-col justify-between hover:border-accent transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-6 h-6 text-accent-end" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">{t.challenges}</h3>
                                        <p className="text-sm text-foreground/40">{challenges.length} {t.active}</p>
                                    </div>
                                </Card>
                            </Link>
                        </div>

                        {/* Download Button */}
                        <div className="pt-4">
                            {isDownloading ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-accent-end flex-shrink-0" />
                                        <span className="text-sm text-foreground/70">{downloadStatus}</span>
                                    </div>
                                    <div className="relative w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent to-accent-end rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-foreground/40">
                                        {downloadProgress}% complete
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleDownload}
                                    disabled={photos.length === 0}
                                    variant="outline"
                                    fullWidth
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download All Photos ({photos.length})
                                </Button>
                            )}
                            {downloadError && (
                                <p className="text-sm text-red-500 mt-2 text-center">{downloadError}</p>
                            )}
                        </div>

                        {/* Danger Zone - Delete Event */}
                        <div className="pt-6 border-t border-border">
                            <p className="text-sm font-medium text-red-500 mb-3 flex items-center gap-1">
                                <Trash2 className="w-4 h-4" />
                                Danger Zone
                            </p>
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Event
                                </Button>
                            ) : (
                                <div className="p-4 bg-red-50 rounded-lg space-y-3">
                                    <p className="text-sm text-red-700 font-medium">
                                        Are you sure you want to delete "{event.name}"?
                                    </p>
                                    <p className="text-xs text-red-600">
                                        This will permanently delete all {photos.length} photos, {challenges.length} challenges, and guest data. This cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="bg-red-500 hover:bg-red-600"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                'Yes, Delete Everything'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: QR Card */}
                    <Card className="w-full md:w-80 flex flex-col items-center text-center space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-bold">{t.guestAccess}</h3>
                            <p className="text-sm text-foreground/60">{t.scanToJoin}</p>

                            <div className="pt-2">
                                {process.env.NEXT_PUBLIC_DEBUG === 'true' ? (
                                    isEditingUrl ? (
                                        <div className="flex gap-2">
                                            <input
                                                className="text-xs border rounded px-2 py-1 w-full bg-surface"
                                                value={baseUrl}
                                                onChange={(e) => setBaseUrl(e.target.value)}
                                                placeholder="http://192.168.x.x:3000"
                                            />
                                            <button onClick={() => setIsEditingUrl(false)} className="text-xs bg-accent px-2 rounded">
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <p
                                            onClick={() => setIsEditingUrl(true)}
                                            className="text-xs text-foreground/30 cursor-pointer hover:text-accent underline decoration-dotted"
                                            title="Click to change domain for local testing"
                                        >
                                            {baseUrl || "Loading..."} (Debug Mode)
                                        </p>
                                    )
                                ) : (
                                    <p className="text-xs text-foreground/30">
                                        {baseUrl}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-inner">
                            {eventUrl && (
                                <QRCodeSVG value={eventUrl} size={200} level="H" />
                            )}
                        </div>

                        <div className="w-full space-y-2">
                            <Button fullWidth variant="primary" onClick={() => window.print()}>
                                {t.printQRCards}
                            </Button>
                            <p className="text-xs text-foreground/40">Use <code className="bg-black/5 px-1 rounded">npm run dev -- -H 0.0.0.0</code> to access locally</p>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
