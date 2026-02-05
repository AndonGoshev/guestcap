"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DownloadButtonProps {
    eventId: string;
    photoCount: number;
}

export function DownloadButton({ eventId, photoCount }: DownloadButtonProps) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        if (photoCount === 0) {
            setError("No photos to download");
            return;
        }

        setDownloading(true);
        setError(null);

        try {
            const response = await fetch(`/api/download/event/${eventId}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Download failed");
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get("Content-Disposition");
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || `event-photos-${eventId}.zip`;

            // Create blob and download
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Download error:", err);
            setError(err.message || "Failed to download");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div>
            <Button
                onClick={handleDownload}
                disabled={downloading || photoCount === 0}
                variant="primary"
                size="lg"
                fullWidth
            >
                {downloading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Preparing download...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5 mr-2" />
                        Download All Photos ({photoCount})
                    </>
                )}
            </Button>

            {error && (
                <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
            )}

            {photoCount === 0 && (
                <p className="text-sm text-foreground/50 mt-2 text-center">
                    No photos uploaded yet
                </p>
            )}
        </div>
    );
}
