"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function Header() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Hide header on guest pages
    if (pathname?.startsWith("/guest")) {
        return null;
    }

    const isDashboard = pathname?.startsWith("/dashboard");
    const showDarkBg = isDashboard || isScrolled;

    const navItems = [
        { label: t.home, href: "/" },
        { label: t.features, href: "/#features" },
        { label: t.pricing, href: "/pricing" },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 md:px-12 px-6
            ${showDarkBg || isMenuOpen
                    ? "bg-black/60 backdrop-blur-md shadow-md py-3"
                    : "bg-transparent py-4"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo / Home Link */}
                <Link href="/" className="text-xl md:text-2xl font-[family-name:var(--font-cormorant)] font-bold text-white mix-blend-difference tracking-wide z-50">
                    GuestCap
                </Link>

                {/* Desktop Navigation - Glassy Pill */}
                <nav className="hidden md:flex items-center gap-1 bg-transparent rounded-full p-1 border border-white/20 transition-all duration-300">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all uppercase tracking-wider text-white hover:bg-white/10`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions & Mobile Toggle */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:block bg-transparent rounded-full p-1 border border-white/20 text-white transition-all duration-300">
                        <LanguageToggle className="text-white hover:text-white/80" />
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden z-50 p-2 text-white bg-white/10 rounded-full border border-white/20 backdrop-blur-md"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div
                className={`
                    md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center space-y-12 h-screen w-full
                    ${isMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-full"}
                `}
            >
                <nav className="flex flex-col items-center space-y-8 w-full px-6 text-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="text-2xl font-[family-name:var(--font-cormorant)] text-white/80 hover:text-white uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 break-words max-w-full"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="pt-12 border-t border-white/20 w-48 flex justify-center">
                    <LanguageToggle className="text-white scale-150" />
                </div>
            </div>
        </header>
    );
}
