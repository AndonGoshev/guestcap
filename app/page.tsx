"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/context/LanguageContext";
import { Camera, Plus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-surface-end/50 rounded-full blur-[80px]" />
      </div>

      <div className="z-10 text-center space-y-4 max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-accent-gradient rounded-2xl flex items-center justify-center shadow-lg transform rotate-[-5deg]">
            <Camera className="w-10 h-10 text-foreground" />
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          GuestCap
        </h1>
        <p className="text-xl text-foreground/70 font-light">
          Minimalistic photo sharing for your special events.
        </p>
      </div>

      <div className="z-10 w-full max-w-md space-y-4">
        <Card className="space-y-4">
          <h2 className="text-lg font-medium text-center">I am a Host</h2>
          <Link href="/dashboard">
            <Button fullWidth variant="primary" size="lg" className="group">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              {t.createEvent}
            </Button>
          </Link>
        </Card>

        <div className="text-center">
          <p className="text-sm text-foreground/40 uppercase tracking-widest my-4">or</p>
        </div>

        <Card variant="glass" className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-medium text-center">I have a Code</h2>
          <Button fullWidth variant="secondary" onClick={() => alert("Scan the QR code provided by the host!")}>
            Scan QR Code
          </Button>
        </Card>
      </div>

      <footer className="absolute bottom-6 text-foreground/30 text-xs">
        © 2026 GuestCap
      </footer>
    </div>
  );
}
