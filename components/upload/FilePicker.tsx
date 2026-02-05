"use client";

import React, { useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes, FileToUpload } from "@/lib/upload/chunked-uploader";

interface FilePickerProps {
    files: FileToUpload[];
    onFilesSelected: (files: File[]) => void;
    onRemoveFile: (fileId: string) => void;
    onStartUpload: () => void;
    disabled?: boolean;
    maxFiles?: number;
    maxSizeMb?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function FilePicker({
    files,
    onFilesSelected,
    onRemoveFile,
    onStartUpload,
    disabled = false,
    maxFiles = 50,
    maxSizeMb = 100,
}: FilePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        // Filter valid files
        const validFiles = selectedFiles.filter(file => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                console.warn(`Skipping ${file.name}: unsupported type ${file.type}`);
                return false;
            }
            if (file.size > maxSizeMb * 1024 * 1024) {
                console.warn(`Skipping ${file.name}: exceeds ${maxSizeMb}MB limit`);
                return false;
            }
            return true;
        });

        // Limit total files
        const remainingSlots = maxFiles - files.length;
        const filesToAdd = validFiles.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
            onFilesSelected(filesToAdd);
        }

        // Reset input
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

    return (
        <div className="space-y-4">
            {/* Drop Zone / Picker */}
            <div
                onClick={() => !disabled && inputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-2xl p-8 text-center 
                    transition-all duration-200 cursor-pointer
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent hover:bg-surface/50'}
                    ${files.length > 0 ? 'border-accent/30' : 'border-border'}
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-end flex items-center justify-center">
                    <Upload className="w-8 h-8 text-foreground/50" />
                </div>

                <p className="font-medium">Tap to select photos</p>
                <p className="text-sm text-foreground/50 mt-1">
                    JPG, PNG, WebP, HEIC • Max {maxSizeMb}MB each
                </p>
            </div>

            {/* Selected Files Preview */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/60">
                            {files.length} {files.length === 1 ? 'photo' : 'photos'} selected
                        </span>
                        <span className="text-foreground/40">
                            {formatBytes(totalSize)}
                        </span>
                    </div>

                    {/* Thumbnails */}
                    <div className="grid grid-cols-4 gap-2">
                        {files.slice(0, 8).map((fileToUpload) => (
                            <div key={fileToUpload.id} className="relative aspect-square">
                                <img
                                    src={URL.createObjectURL(fileToUpload.file)}
                                    alt={fileToUpload.file.name}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFile(fileToUpload.id);
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {files.length > 8 && (
                            <div className="aspect-square bg-surface-end rounded-lg flex items-center justify-center">
                                <span className="text-foreground/50 font-medium">
                                    +{files.length - 8}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={onStartUpload}
                        disabled={disabled || files.length === 0}
                    >
                        <Image className="w-5 h-5 mr-2" />
                        Upload {files.length} {files.length === 1 ? 'Photo' : 'Photos'}
                    </Button>
                </div>
            )}
        </div>
    );
}
