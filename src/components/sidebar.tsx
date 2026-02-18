"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

const links = [
  { href: "/dashboard", key: "dashboard", icon: "📊" },
  { href: "/market", key: "marketIntel", icon: "🌍" },
  { href: "/proposals", key: "tradeProposals", icon: "⚡" },
  { href: "/holdings", key: "holdings", icon: "💰" },
  { href: "/transactions", key: "transactions", icon: "📝" },
  { href: "/opportunities", key: "opportunities", icon: "🔎" },
  { href: "/reports", key: "reports", icon: "📄" },
  { href: "/costs", key: "costs", icon: "💸" },
  { href: "/risk", key: "risk", icon: "⚠️" },
  { href: "/settings", key: "settings", icon: "⚙️" },
] as const;

export function Sidebar({ userName, locale = "en" }: { userName?: string | null; locale?: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <button onClick={() => setOpen(!open)} className="p-2 -ml-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="font-bold text-gray-900 text-sm">CryptoLens</span>
        </Link>
        <div className="w-8" />
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />}

      <aside className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-xl">🔍</span>
            <span className="font-bold text-gray-900">CryptoLens</span>
          </Link>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${pathname === l.href ? "bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-500" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
              <span className="text-base">{l.icon}</span>
              <span>{t(l.key, locale)}</span>
            </Link>
          ))}
        </nav>
        <div className="p-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2 truncate">{userName}</p>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-gray-400 hover:text-gray-700 transition">{t("signOut", locale)}</button>
        </div>
      </aside>
    </>
  );
}
