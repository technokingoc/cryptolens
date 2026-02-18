"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

const mainLinks = [
  { href: "/dashboard", key: "dashboard", icon: "📊" },
  { href: "/market", key: "market", icon: "🌍" },
  { href: "/proposals", key: "tradeProposals", icon: "⚡" },
  { href: "/holdings", key: "holdings", icon: "💰" },
] as const;

const moreLinks = [
  { href: "/transactions", key: "transactions", icon: "📝" },
  { href: "/opportunities", key: "opportunities", icon: "🔎" },
  { href: "/reports", key: "reports", icon: "📄" },
  { href: "/costs", key: "costs", icon: "💸" },
  { href: "/risk", key: "risk", icon: "⚠️" },
  { href: "/settings", key: "settings", icon: "⚙️" },
] as const;

export function MobileBottomNav({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreLinks.some((l) => pathname === l.href);

  return (
    <>
      {showMore && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setShowMore(false)} />
          <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-lg z-50 p-3">
            <div className="grid grid-cols-3 gap-2">
              {moreLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${
                    pathname === l.href
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{l.icon}</span>
                  <span>{t(l.key, locale)}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mainLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
                pathname === l.href
                  ? "text-blue-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              <span className="text-lg">{l.icon}</span>
              <span>{t(l.key, locale)}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
              isMoreActive || showMore ? "text-blue-700 font-medium" : "text-gray-400"
            }`}
          >
            <span className="text-lg">•••</span>
            <span>{t("more", locale)}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
