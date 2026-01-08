import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GuestCap - Minimalist Event Photos",
  description: "Share event photos effortlessly.",
};

import { LanguageProvider } from "@/context/LanguageContext";
import { LanguageSetter } from "@/components/LanguageSetter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body
        className={`${outfit.variable} antialiased`}
      >
        <LanguageProvider>
          <LanguageSetter />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
