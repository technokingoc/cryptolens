"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/market", label: "Market", icon: "🌍" },
  { href: "/proposals", label: "Proposals", icon: "⚡" },
  { href: "/holdings", label: "Holdings", icon: "💰" },
];

const moreLinks = [
  { href: "/transactions", label: "Transactions", icon: "📝" },
  { href: "/opportunities", label: "Opportunities", icon: "🔎" },
  { href: "/reports", label: "Reports", icon: "📄" },
  { href: "/costs", label: "Costs", icon: "💸" },
  { href: "/risk", label: "Risk", icon: "⚠️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreLinks.some((l) => pathname === l.href);

  return (
    <>
      {/* More menu overlay */}
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
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mainLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
                pathname === l.href
                  ? "text-gray-900 font-medium"
                  : "text-gray-400"
              }`}
            >
              <span className="text-lg">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
              isMoreActive || showMore ? "text-gray-900 font-medium" : "text-gray-400"
            }`}
          >
            <span className="text-lg">•••</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
