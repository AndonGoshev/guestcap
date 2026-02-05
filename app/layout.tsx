import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "GuestCap - Minimalist Event Photos",
  description: "Share event photos effortlessly.",
};

import { LanguageProvider } from "@/context/LanguageContext";
import { LanguageSetter } from "@/components/LanguageSetter";
import { Header } from "@/components/layout/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body
        className={`${outfit.variable} ${cormorant.variable} antialiased`}
      >
        <LanguageProvider>
          <LanguageSetter />
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

