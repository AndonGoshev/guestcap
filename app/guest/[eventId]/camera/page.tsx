"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useChallenges } from "@/hooks/useChallenges";
import { usePhotos } from "@/hooks/usePhotos";
import { ArrowLeft, Camera as CameraIcon, Check, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function CameraPage() {
    const { eventId } = useParams() as { eventId: string };
    const { t } = useLanguage();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { challenges } = useChallenges(eventId);
    const { addPhoto } = usePhotos(eventId);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
    const [showChallenges, setShowChallenges] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const [permissionError, setPermissionError] = useState<string | null>(null);

    // Initialize Camera
    const startCamera = useCallback(async () => {
        setPermissionError(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not available. This usually happens when not using HTTPS.");
            }

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode }
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            let msg = "Could not access camera.";
            if (err.name === 'NotAllowedError') {
                msg = "Permission denied. Please allow camera access in your browser settings.";
            } else if (err.name === 'NotFoundError') {
                msg = "No camera found on this device.";
            } else if (err.message.includes("not available")) {
                msg = "Camera requires HTTPS. If testing locally, use 'chrome://flags' > 'Insecure origins treated as secure' or use 'Use Localhost' on PC.";
            }
            setPermissionError(msg);
        }
    }, [facingMode]);

    // Auto-start only if secure context, otherwise wait for user
    useEffect(() => {
        if (typeof window !== 'undefined' && window.isSecureContext) {
            startCamera();
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []); // Run once on mount

    // Capture
    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(dataUrl);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleSend = () => {
        if (!capturedImage) return;
        setIsSending(true);

        const guestName = localStorage.getItem(`gc_guest_${eventId}`) || "Anonymous";

        // Simulate network delay
        setTimeout(() => {
            addPhoto({
                event_id: eventId,
                guest_id: guestName,
                url: capturedImage,
                challenge_id: selectedChallengeId || undefined
            });
            setIsSending(false);
            setCapturedImage(null);
            alert(t.sentSuccess);
        }, 1500);
    };

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        setTimeout(() => startCamera(), 100);
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden">

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Permission Error / Start Screen */}
            {!stream && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-6 z-50 bg-background text-foreground">
                    <div className="w-20 h-20 bg-surface-end rounded-full flex items-center justify-center">
                        <CameraIcon className="w-10 h-10 text-foreground/50" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold">Camera Access</h2>
                        <p className="text-sm text-foreground/60 max-w-xs mx-auto">
                            {permissionError || "We need access to your camera to take photos."}
                        </p>
                    </div>
                    <Button onClick={startCamera} variant="primary" size="lg">
                        Enable Camera
                    </Button>
                    {!window.isSecureContext && (
                        <p className="text-xs text-red-500 max-w-xs text-center">
                            Warning: Not on HTTPS. Camera might be blocked by browser.
                        </p>
                    )}
                </div>
            )}

            {/* Main View */}
            {capturedImage ? (
                // Preview State
                <div className="relative w-full h-full flex flex-col">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />

                    <div className="absolute inset-0 flex flex-col justify-between p-6 bg-black/20 backdrop-blur-[2px]">
                        <div className="flex justify-start">
                            {selectedChallengeId && (
                                <div className="bg-accent text-foreground px-4 py-2 rounded-full font-bold flex items-center shadow-lg animate-in slide-in-from-top-4">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {challenges.find(c => c.id === selectedChallengeId)?.title}
                                </div>
                            )}
                        </div>

                        <div className="w-full flex justify-between items-center gap-6">
                            <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white rounded-full w-14 h-14 p-0" onClick={handleRetake}>
                                <ArrowLeft className="w-6 h-6" />
                            </Button>

                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-1 h-14 text-lg rounded-full shadow-xl"
                                onClick={handleSend}
                            >
                                {isSending ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        {t.send} <Send className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                // Camera State
                <div className="relative w-full h-full">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => videoRef.current?.play()}
                    />

                    {/* Overlays */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
                        {/* Top Bar */}
                        <div className="flex justify-between items-start">
                            {/* Challenge Indicator */}
                            <div
                                onClick={() => setShowChallenges(true)}
                                className={`
                             px-4 py-2 rounded-full font-bold flex items-center shadow-lg cursor-pointer transition-all active:scale-95
                             ${selectedChallengeId ? 'bg-[#16A34A] text-white' : 'bg-black/50 text-white backdrop-blur-md'}
                        `}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {selectedChallengeId
                                    ? challenges.find(c => c.id === selectedChallengeId)?.title
                                    : t.challengesTitle}
                            </div>

                            <Button variant="ghost" size="icon" className="bg-black/20 text-white rounded-full" onClick={handleSwitchCamera}>
                                <RefreshCw className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Bottom Controls */}
                        <div className="flex justify-center items-center pb-8">
                            <button
                                onClick={handleCapture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative active:scale-95 transition-transform"
                            >
                                <div className="w-16 h-16 bg-white rounded-full" />
                            </button>
                        </div>
                    </div>

                    {/* Challenges Modal Overlay */}
                    {showChallenges && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col justify-end animate-in slide-in-from-bottom-10">
                            <div className="bg-surface rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto text-foreground">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{t.selectChallenge}</h2>
                                    <Button variant="ghost" size="icon" onClick={() => setShowChallenges(false)}>
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => { setSelectedChallengeId(null); setShowChallenges(false); }}
                                        className={`w-full p-4 rounded-xl text-left font-medium transition-colors border ${!selectedChallengeId ? 'bg-accent text-foreground border-accent' : 'bg-surface-end border-border'}`}
                                    >
                                        <span className="flex items-center">
                                            <CameraIcon className="w-5 h-5 mr-3 opacity-50" />
                                            {t.noChallenge}
                                        </span>
                                    </button>

                                    {challenges.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedChallengeId(c.id); setShowChallenges(false); }}
                                            className={`w-full p-4 rounded-xl text-left font-medium transition-colors border ${selectedChallengeId === c.id ? 'bg-accent text-foreground border-accent' : 'bg-surface-end border-border'}`}
                                        >
                                            <span className="flex items-center">
                                                <Sparkles className="w-5 h-5 mr-3 opacity-50" />
                                                {c.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
