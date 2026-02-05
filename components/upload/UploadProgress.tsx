"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadProgress as UploadProgressType, formatBytes } from "@/lib/upload/chunked-uploader";

interface UploadProgressProps {
    progress: UploadProgressType;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    onDone?: () => void;
}

export function UploadProgress({
    progress,
    onPause,
    onResume,
    onCancel,
    onDone,
}: UploadProgressProps) {
    const isComplete = progress.status === 'complete';
    const isError = progress.status === 'error';
    const isPaused = progress.status === 'paused';
    const isUploading = progress.status === 'uploading';

    return (
        <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in">
            {/* Status Icon */}
            <div className="flex justify-center">
                {isComplete && (
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                )}
                {isError && (
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                )}
                {(isUploading || isPaused) && (
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                        <Loader2 className={`w-8 h-8 text-accent ${isUploading ? 'animate-spin' : ''}`} />
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div className="text-center">
                {isComplete && (
                    <>
                        <h3 className="text-xl font-bold text-green-600">Upload Complete!</h3>
                        <p className="text-foreground/60 mt-1">
                            {progress.completedFiles} {progress.completedFiles === 1 ? 'photo' : 'photos'} uploaded successfully
                        </p>
                    </>
                )}
                {isError && (
                    <>
                        <h3 className="text-xl font-bold text-red-600">Upload Failed</h3>
                        <p className="text-foreground/60 mt-1">{progress.error}</p>
                    </>
                )}
                {isPaused && (
                    <>
                        <h3 className="text-xl font-bold">Upload Paused</h3>
                        <p className="text-foreground/60 mt-1">
                            {progress.completedFiles} of {progress.totalFiles} files uploaded
                        </p>
                    </>
                )}
                {isUploading && (
                    <>
                        <h3 className="text-xl font-bold">Uploading...</h3>
                        <p className="text-foreground/60 mt-1 truncate max-w-xs mx-auto">
                            {progress.currentFileName}
                        </p>
                    </>
                )}
            </div>

            {/* Progress Bar */}
            {(isUploading || isPaused) && (
                <div className="space-y-2">
                    <div className="h-3 bg-surface-end rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-gradient transition-all duration-300 ease-out"
                            style={{ width: `${progress.overallProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm text-foreground/50">
                        <span>
                            {progress.completedFiles} of {progress.totalFiles} files
                        </span>
                        <span>{progress.overallProgress}%</span>
                    </div>
                    <div className="text-center text-sm text-foreground/40">
                        {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.bytesTotal)}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center pt-2">
                {isUploading && onPause && (
                    <Button variant="outline" onClick={onPause}>
                        Pause
                    </Button>
                )}
                {isPaused && onResume && (
                    <Button variant="primary" onClick={onResume}>
                        Resume
                    </Button>
                )}
                {(isUploading || isPaused) && onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                )}
                {isComplete && onDone && (
                    <Button variant="primary" onClick={onDone}>
                        Done
                    </Button>
                )}
                {isError && onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    );
}
