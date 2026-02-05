"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGuestIdentity } from "@/hooks/useGuestIdentity";
import { useEvent } from "@/hooks/useEvent";
import { FilePicker } from "@/components/upload/FilePicker";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { LoadingScreen } from "@/components/guest/LoadingScreen";
import { EventNotFound } from "@/components/guest/EventNotFound";
import { EventInactive } from "@/components/guest/EventInactive";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import {
    ChunkedUploader,
    FileToUpload,
    UploadProgress as UploadProgressType,
} from "@/lib/upload/chunked-uploader";

type UploadState = 'selecting' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
    const { eventId } = useParams() as { eventId: string };
    const router = useRouter();
    const { t } = useLanguage();

    const { identity, loading: identityLoading } = useGuestIdentity(eventId);
    const { event, loading: eventLoading } = useEvent(eventId);

    const [uploadState, setUploadState] = useState<UploadState>('selecting');
    const [files, setFiles] = useState<FileToUpload[]>([]);
    const [progress, setProgress] = useState<UploadProgressType>({
        totalFiles: 0,
        completedFiles: 0,
        currentFileName: '',
        currentFileProgress: 0,
        overallProgress: 0,
        bytesUploaded: 0,
        bytesTotal: 0,
        status: 'idle',
    });
    const [uploadedIds, setUploadedIds] = useState<string[]>([]);

    const uploader = useMemo(() => {
        if (!identity) return null;

        return new ChunkedUploader({
            eventId,
            guestId: identity.guestId,
            guestToken: identity.guestToken,
            onProgress: (p) => {
                setProgress(p);
                if (p.status === 'complete') {
                    setUploadState('success');
                } else if (p.status === 'error') {
                    setUploadState('error');
                }
            },
            onComplete: (ids) => {
                setUploadedIds(ids);
                setUploadState('success');
            },
            onError: (error) => {
                console.error('Upload error:', error);
                setUploadState('error');
            },
        });
    }, [eventId, identity]);

    // Loading
    if (identityLoading || eventLoading) {
        return <LoadingScreen />;
    }

    // Not found
    if (!event) {
        return <EventNotFound />;
    }

    // Inactive
    if (event.is_active === false) {
        return <EventInactive eventName={event.name} />;
    }

    // No identity - redirect to main page
    if (!identity) {
        router.replace(`/guest/${eventId}`);
        return <LoadingScreen />;
    }

    const handleFilesSelected = (newFiles: File[]) => {
        if (!uploader) return;
        const addedFiles = uploader.addFiles(newFiles);
        setFiles([...files, ...addedFiles]);
    };

    const handleRemoveFile = (fileId: string) => {
        if (!uploader) return;
        uploader.removeFile(fileId);
        setFiles(files.filter(f => f.id !== fileId));
    };

    const handleStartUpload = () => {
        if (!uploader || files.length === 0) return;
        setUploadState('uploading');
        uploader.start();
    };

    const handlePause = () => {
        uploader?.pause();
        setProgress(prev => ({ ...prev, status: 'paused' }));
    };

    const handleResume = () => {
        uploader?.resume();
    };

    const handleCancel = () => {
        uploader?.cancel();
        setFiles([]);
        setUploadState('selecting');
        setProgress({
            totalFiles: 0,
            completedFiles: 0,
            currentFileName: '',
            currentFileProgress: 0,
            overallProgress: 0,
            bytesUploaded: 0,
            bytesTotal: 0,
            status: 'idle',
        });
    };

    const handleDone = () => {
        router.push(`/guest/${eventId}`);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    disabled={uploadState === 'uploading'}
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t.back}
                </Button>
                <LanguageToggle />
            </div>

            <div className="max-w-md mx-auto">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Upload Photos</h1>
                    <p className="text-foreground/60">{event.name}</p>
                </div>

                {/* Content based on state */}
                {uploadState === 'selecting' && (
                    <FilePicker
                        files={files}
                        onFilesSelected={handleFilesSelected}
                        onRemoveFile={handleRemoveFile}
                        onStartUpload={handleStartUpload}
                    />
                )}

                {(uploadState === 'uploading' || uploadState === 'success' || uploadState === 'error') && (
                    <UploadProgress
                        progress={progress}
                        onPause={handlePause}
                        onResume={handleResume}
                        onCancel={handleCancel}
                        onDone={handleDone}
                    />
                )}

                {/* Success message */}
                {uploadState === 'success' && (
                    <div className="text-center mt-6 animate-in fade-in">
                        <p className="text-foreground/60">
                            ✨ Your photos are now part of {event.name}!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
