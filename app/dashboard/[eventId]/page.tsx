"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useEvents } from "@/hooks/useEvents";
import { usePhotos } from "@/hooks/usePhotos";
import { useChallenges } from "@/hooks/useChallenges";
import { useLanguage } from "@/context/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Share2, Folder, Image as ImageIcon, Sparkles, Power, Download, Loader2, Trash2, Calendar, Settings } from "lucide-react";
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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
        <div className="min-h-screen bg-background p-6 md:p-12 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="pl-0">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.dashboard}
                        </Button>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground/50">ID: {eventId.slice(0, 8)}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">

                    {/* Event Info */}
                    <div>
                        <h1 className="text-5xl font-bold text-foreground mb-2">{event.name}</h1>
                        <p className="text-foreground/60">{t.createdOn} {new Date(event.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Stats Cards */}
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
                    <div>
                        {isDownloading ? (
                            <div className="space-y-3 p-4 bg-surface rounded-xl border border-border">
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
                                className="h-14 text-lg border-2 border-dashed border-border hover:border-accent hover:bg-surface/50"
                            >
                                <Download className="w-5 h-5 mr-3" />
                                {t.downloadAllPhotos} ({photos.length})
                            </Button>
                        )}
                        {downloadError && (
                            <p className="text-sm text-red-500 mt-2 text-center">{downloadError}</p>
                        )}
                    </div>

                    <div className="w-full border-b-2 border-dashed border-border/50" />

                    {/* QR Code Ticket */}
                    <div className="space-y-6 py-8">
                        <h1 className="text-xl font-bold text-foreground/70">{t.qrReady}</h1>

                        <div className="flex flex-col items-start space-y-4 w-full">
                            <div className="w-full overflow-x-auto pb-4 -mx-2 px-2 md:-mx-0 md:px-0">
                                <div
                                    className="bg-[#3c4142] text-white overflow-hidden shadow-lg flex flex-row relative flex-shrink-0"
                                    style={{ width: '120mm', height: '51mm', minWidth: '120mm' }}
                                >
                                    {/* Left: Image (40%) with QR Code Overlay */}
                                    <div className="w-[40%] relative h-full flex-shrink-0">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={{
                                                backgroundImage: `url(${event.event_image_url || "/images/events/default-event-image.jpg"})`,
                                            }}
                                        />
                                        {/* QR Code Centered on Image */}
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <div className="bg-white p-1 shadow-sm rounded-none">
                                                {eventUrl && (
                                                    <QRCodeSVG value={eventUrl} size={85} level="L" marginSize={0} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Content (60%) */}
                                    <div className="w-[60%] h-full bg-[#3c4142] p-3 flex flex-col justify-center text-white overflow-hidden">
                                        <h2 className="text-base font-bold leading-tight">{event.name}</h2>
                                        <p className="text-[12px] opacity-60 mb-2">
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-[11px] leading-tight opacity-90">
                                            Сканирай QR кода, включи се в предизвикателствата и накрая ни изпрати всички снимки, които си заснел по време на събитието. Пожелаваме ти приятно изкарване!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="h-11 px-8 rounded-xl border-border hover:bg-surface"
                                onClick={() => { }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Свали QR картичката
                            </Button>
                        </div>
                    </div>

                    {/* Settings Button */}
                    <div className="flex justify-center pt-8">
                        <Button
                            variant="ghost"
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-foreground/40 hover:text-foreground hover:bg-transparent"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {t.eventSettings}
                        </Button>
                    </div>

                </div>
            </div>

            {/* Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title={t.eventSettings}
            >
                <div className="space-y-6">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                <Power className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium">{t.eventActive}</p>
                                <p className="text-xs text-foreground/50">{t.guestUploadsEnabled}</p>
                            </div>
                        </div>
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
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-red-500 mb-3 flex items-center gap-1">
                            <Trash2 className="w-4 h-4" />
                            {t.dangerZone}
                        </p>
                        {!showDeleteConfirm ? (
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-red-500 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.deleteEvent}
                            </Button>
                        ) : (
                            <div className="p-4 bg-red-50 rounded-xl space-y-3">
                                <p className="text-sm text-red-700 font-medium">
                                    {t.deleteEventConfirm}
                                </p>
                                <p className="text-xs text-red-600">
                                    {t.deleteEventWarning}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        fullWidth
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                    >
                                        {t.cancel}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        fullWidth
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-red-500 hover:bg-red-600 border-none text-white"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            t.yesDelete
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
