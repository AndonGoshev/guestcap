/**
 * Chunked Upload System
 * Handles large file uploads with progress tracking and resume capability
 */

export interface UploadProgress {
    totalFiles: number;
    completedFiles: number;
    currentFileName: string;
    currentFileProgress: number; // 0-100
    overallProgress: number; // 0-100
    bytesUploaded: number;
    bytesTotal: number;
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error' | 'paused';
    error?: string;
}

export interface FileToUpload {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
}

export interface UploadSessionResponse {
    sessionId: string;
    signedUrls: { fileId: string; url: string; path: string }[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in ms

export class ChunkedUploader {
    private files: FileToUpload[] = [];
    private eventId: string;
    private guestId: string;
    private guestToken: string;
    private onProgress: (progress: UploadProgress) => void;
    private onComplete: (uploadedIds: string[]) => void;
    private onError: (error: string) => void;
    private abortController: AbortController | null = null;
    private isPaused: boolean = false;
    private uploadedFileIds: string[] = [];

    constructor(config: {
        eventId: string;
        guestId: string;
        guestToken: string;
        onProgress: (progress: UploadProgress) => void;
        onComplete: (uploadedIds: string[]) => void;
        onError: (error: string) => void;
    }) {
        this.eventId = config.eventId;
        this.guestId = config.guestId;
        this.guestToken = config.guestToken;
        this.onProgress = config.onProgress;
        this.onComplete = config.onComplete;
        this.onError = config.onError;
    }

    addFiles(files: File[]) {
        const newFiles: FileToUpload[] = files.map(file => ({
            file,
            id: crypto.randomUUID(),
            progress: 0,
            status: 'pending' as const,
        }));
        this.files = [...this.files, ...newFiles];
        return newFiles;
    }

    removeFile(fileId: string) {
        this.files = this.files.filter(f => f.id !== fileId);
    }

    getFiles(): FileToUpload[] {
        return this.files;
    }

    getTotalSize(): number {
        return this.files.reduce((sum, f) => sum + f.file.size, 0);
    }

    async start() {
        if (this.files.length === 0) {
            this.onError('No files to upload');
            return;
        }

        this.abortController = new AbortController();
        this.isPaused = false;
        this.uploadedFileIds = [];

        const totalBytes = this.getTotalSize();
        let uploadedBytes = 0;

        try {
            // Create upload session
            const session = await this.createUploadSession();
            if (!session) {
                throw new Error('Failed to create upload session');
            }

            // Upload each file
            for (let i = 0; i < this.files.length; i++) {
                if (this.isPaused || this.abortController?.signal.aborted) {
                    break;
                }

                const fileToUpload = this.files[i];
                const signedUrl = session.signedUrls.find(s => s.fileId === fileToUpload.id);

                if (!signedUrl) {
                    console.error('No signed URL for file:', fileToUpload.id);
                    continue;
                }

                fileToUpload.status = 'uploading';

                this.onProgress({
                    totalFiles: this.files.length,
                    completedFiles: i,
                    currentFileName: fileToUpload.file.name,
                    currentFileProgress: 0,
                    overallProgress: Math.round((uploadedBytes / totalBytes) * 100),
                    bytesUploaded: uploadedBytes,
                    bytesTotal: totalBytes,
                    status: 'uploading',
                });

                try {
                    await this.uploadFile(fileToUpload, signedUrl.url, signedUrl.path, (progress) => {
                        fileToUpload.progress = progress;
                        const currentBytes = uploadedBytes + (fileToUpload.file.size * progress / 100);

                        this.onProgress({
                            totalFiles: this.files.length,
                            completedFiles: i,
                            currentFileName: fileToUpload.file.name,
                            currentFileProgress: progress,
                            overallProgress: Math.round((currentBytes / totalBytes) * 100),
                            bytesUploaded: Math.round(currentBytes),
                            bytesTotal: totalBytes,
                            status: 'uploading',
                        });
                    });

                    fileToUpload.status = 'complete';
                    fileToUpload.progress = 100;
                    uploadedBytes += fileToUpload.file.size;
                    this.uploadedFileIds.push(signedUrl.path);
                } catch (error: any) {
                    fileToUpload.status = 'error';
                    fileToUpload.error = error.message;
                    console.error('File upload error:', error);
                    // Continue with next file
                }
            }

            // Complete the session
            await this.completeSession(session.sessionId);

            this.onProgress({
                totalFiles: this.files.length,
                completedFiles: this.files.filter(f => f.status === 'complete').length,
                currentFileName: '',
                currentFileProgress: 100,
                overallProgress: 100,
                bytesUploaded: uploadedBytes,
                bytesTotal: totalBytes,
                status: 'complete',
            });

            this.onComplete(this.uploadedFileIds);
        } catch (error: any) {
            this.onProgress({
                totalFiles: this.files.length,
                completedFiles: this.files.filter(f => f.status === 'complete').length,
                currentFileName: '',
                currentFileProgress: 0,
                overallProgress: 0,
                bytesUploaded: 0,
                bytesTotal: totalBytes,
                status: 'error',
                error: error.message,
            });
            this.onError(error.message);
        }
    }

    pause() {
        this.isPaused = true;
        this.abortController?.abort();
    }

    resume() {
        this.isPaused = false;
        // Re-upload only pending/error files
        this.files = this.files.map(f =>
            f.status === 'uploading' ? { ...f, status: 'pending' as const } : f
        );
        this.start();
    }

    cancel() {
        this.abortController?.abort();
        this.files = [];
        this.uploadedFileIds = [];
    }

    private async createUploadSession(): Promise<UploadSessionResponse | null> {
        const response = await fetch('/api/upload/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: this.eventId,
                guestId: this.guestId,
                guestToken: this.guestToken,
                files: this.files.map(f => ({
                    id: f.id,
                    name: f.file.name,
                    size: f.file.size,
                    type: f.file.type,
                })),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create upload session');
        }

        return response.json();
    }

    private async uploadFile(
        fileToUpload: FileToUpload,
        signedUrl: string,
        path: string,
        onProgress: (progress: number) => void
    ): Promise<void> {
        return this.uploadWithRetry(fileToUpload.file, signedUrl, onProgress, 0);
    }

    private async uploadWithRetry(
        file: File,
        signedUrl: string,
        onProgress: (progress: number) => void,
        attempt: number
    ): Promise<void> {
        try {
            await this.uploadToStorage(file, signedUrl, onProgress);
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.uploadWithRetry(file, signedUrl, onProgress, attempt + 1);
            }
            throw error;
        }
    }

    private async uploadToStorage(
        file: File,
        signedUrl: string,
        onProgress: (progress: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            xhr.open('PUT', signedUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(file);
        });
    }

    private async completeSession(sessionId: string): Promise<void> {
        const response = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                guestToken: this.guestToken,
                uploadedPaths: this.uploadedFileIds,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to complete upload session');
        }
    }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
