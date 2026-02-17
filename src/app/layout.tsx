import type { Metadata } from "next";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoLens — Portfolio Intelligence",
  description: "Investment portfolio tracking and capital management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
