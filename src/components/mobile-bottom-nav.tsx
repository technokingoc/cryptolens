"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  Globe,
  Zap,
  Wallet,
  ArrowLeftRight,
  Search,
  FileText,
  DollarSign,
  ShieldAlert,
  Settings,
  Ellipsis,
} from "lucide-react";
import { t, type Locale, type DictKey } from "@/lib/i18n";

type NavItem = {
  href: string;
  key: DictKey;
  icon: ComponentType<{ className?: string }>;
};

const mainLinks: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/market", key: "market", icon: Globe },
  { href: "/proposals", key: "tradeProposals", icon: Zap },
  { href: "/holdings", key: "holdings", icon: Wallet },
];

const moreLinks: NavItem[] = [
  { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
  { href: "/opportunities", key: "opportunities", icon: Search },
  { href: "/reports", key: "reports", icon: FileText },
  { href: "/costs", key: "costs", icon: DollarSign },
  { href: "/risk", key: "risk", icon: ShieldAlert },
  { href: "/settings", key: "settings", icon: Settings },
];

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
              {moreLinks.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${
                      pathname === l.href ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(l.key, locale)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mainLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
                  pathname === l.href ? "text-emerald-700 font-medium" : "text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(l.key, locale)}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] transition ${
              isMoreActive || showMore ? "text-emerald-700 font-medium" : "text-gray-400"
            }`}
          >
            <Ellipsis className="w-4 h-4" />
            <span>{t("more", locale)}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
