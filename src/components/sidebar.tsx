"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/holdings", label: "Holdings", icon: "💰" },
  { href: "/transactions", label: "Transactions", icon: "📝" },
  { href: "/costs", label: "Costs", icon: "💸" },
  { href: "/risk", label: "Risk", icon: "⚠️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-50">
      <div className="p-3 md:p-4 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <span className="hidden md:block font-bold text-white text-sm">CryptoLens</span>
        </Link>
      </div>
      <nav className="flex-1 py-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`flex items-center gap-3 px-3 md:px-4 py-2.5 text-sm transition ${pathname === l.href ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            <span className="text-base">{l.icon}</span>
            <span className="hidden md:block">{l.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 md:p-4 border-t border-gray-800">
        <p className="hidden md:block text-xs text-gray-500 mb-2 truncate">{userName}</p>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-gray-500 hover:text-white transition">Logout</button>
      </div>
    </aside>
  );
}
