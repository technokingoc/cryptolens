"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/market", label: "Market Intel", icon: "🌍" },
  { href: "/proposals", label: "Trade Proposals", icon: "⚡" },
  { href: "/holdings", label: "Holdings", icon: "💰" },
  { href: "/transactions", label: "Transactions", icon: "📝" },
  { href: "/opportunities", label: "Opportunities", icon: "🔎" },
  { href: "/reports", label: "Reports", icon: "📄" },
  { href: "/costs", label: "Costs", icon: "💸" },
  { href: "/risk", label: "Risk", icon: "⚠️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
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

      {/* Mobile overlay */}
      {open && <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-xl">🔍</span>
            <span className="font-bold text-gray-900">CryptoLens</span>
          </Link>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${pathname === l.href ? "bg-gray-100 text-gray-900 font-medium border-r-2 border-gray-400" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2 truncate">{userName}</p>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-gray-400 hover:text-gray-700 transition">Sign out</button>
        </div>
      </aside>
    </>
  );
}
