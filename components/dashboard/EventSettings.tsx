"use client";

import React, { useState } from "react";
import { Settings, Power, Calendar, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface EventSettingsProps {
    event: {
        id: string;
        name: string;
        is_active?: boolean;
        upload_deadline?: string | null;
    };
    onUpdate: (updates: Partial<{
        is_active: boolean;
        upload_deadline: string | null;
    }>) => Promise<void>;
    onDelete?: () => void;
}

export function EventSettings({ event, onUpdate, onDelete }: EventSettingsProps) {
    const [isActive, setIsActive] = useState(event.is_active !== false);
    const [deadline, setDeadline] = useState(event.upload_deadline || '');
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleToggleActive = async () => {
        const newValue = !isActive;
        setIsActive(newValue);
        setSaving(true);
        try {
            await onUpdate({ is_active: newValue });
        } catch (error) {
            setIsActive(!newValue); // Revert on error
        } finally {
            setSaving(false);
        }
    };

    const handleDeadlineChange = async (value: string) => {
        setDeadline(value);
        setSaving(true);
        try {
            await onUpdate({ upload_deadline: value || null });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-foreground/50" />
                <h3 className="font-semibold">Event Settings</h3>
            </div>

            <div className="space-y-4">
                {/* Active Toggle */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Power className={`w-5 h-5 ${isActive ? 'text-green-500' : 'text-foreground/30'}`} />
                        <div>
                            <p className="font-medium">Event Active</p>
                            <p className="text-sm text-foreground/50">
                                {isActive ? 'Guests can upload photos' : 'Guests see "inactive" message'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleActive}
                        disabled={saving}
                        className={`
                            relative w-12 h-6 rounded-full transition-colors duration-200
                            ${isActive ? 'bg-green-500' : 'bg-foreground/20'}
                            ${saving ? 'opacity-50' : ''}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                                ${isActive ? 'translate-x-7' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>

                {/* Upload Deadline */}
                <div className="py-3 border-b border-border">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-foreground/50" />
                        <div>
                            <p className="font-medium">Upload Deadline</p>
                            <p className="text-sm text-foreground/50">
                                Optional cutoff date for guest uploads
                            </p>
                        </div>
                    </div>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => handleDeadlineChange(e.target.value)}
                        className="w-full mt-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    {deadline && (
                        <button
                            onClick={() => handleDeadlineChange('')}
                            className="text-xs text-foreground/50 hover:text-foreground mt-1"
                        >
                            Clear deadline
                        </button>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="pt-2">
                    <p className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
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
                            Delete Event
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-foreground/70">
                                Are you sure? This will delete all photos and cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={onDelete}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
