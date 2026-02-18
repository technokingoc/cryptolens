import type { Metadata } from "next";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { UiPreferencesBootstrap } from "@/components/ui-preferences-bootstrap";
import { getLocaleFromCookie } from "@/lib/i18n";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoLens — Portfolio Intelligence",
  description: "Investment portfolio tracking and capital management platform",
  openGraph: {
    title: "CryptoLens — Portfolio Intelligence",
    description: "Investment portfolio tracking and capital management platform",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value);

  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen">
        <UiPreferencesBootstrap />
        {children}
        <MobileBottomNav locale={locale} />
      </body>
    </html>
  );
}
