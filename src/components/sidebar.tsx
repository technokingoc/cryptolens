"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
} from "lucide-react";
import { t, type Locale, type DictKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

type NavLink = {
  href: string;
  key: DictKey;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = {
  labelKey: DictKey;
  links: NavLink[];
};

const sections: NavSection[] = [
  {
    labelKey: "navOverview",
    links: [{ href: "/dashboard", key: "dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "navIntelligence",
    links: [
      { href: "/market", key: "market", icon: Globe },
      { href: "/proposals", key: "tradeProposals", icon: Zap },
      { href: "/opportunities", key: "opportunities", icon: Search },
    ],
  },
  {
    labelKey: "navPortfolio",
    links: [
      { href: "/holdings", key: "holdings", icon: Wallet },
      { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
      { href: "/costs", key: "costs", icon: DollarSign },
    ],
  },
  {
    labelKey: "navAnalysis",
    links: [
      { href: "/reports", key: "reports", icon: FileText },
      { href: "/risk", key: "risk", icon: ShieldAlert },
    ],
  },
];

const settingsLink: NavLink = { href: "/settings", key: "settings", icon: Settings };

const pageTitleByPath: Record<string, DictKey> = {
  "/dashboard": "dashboard",
  "/market": "marketIntelligence",
  "/proposals": "tradeProposals",
  "/holdings": "holdings",
  "/transactions": "transactions",
  "/opportunities": "opportunities",
  "/reports": "analysisReportsTitle",
  "/costs": "costs",
  "/risk": "risk",
  "/settings": "settings",
};

export function Sidebar({ userName, locale = "en" }: { userName?: string | null; locale?: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const titleKey = pageTitleByPath[pathname] ?? "dashboard";

  const itemClass = (href: string) =>
    `flex items-center gap-3 px-5 py-2.5 text-sm rounded-lg mx-2 transition-colors ${
      pathname === href
        ? "bg-blue-50 text-blue-700 font-medium"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    }`;

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <button onClick={() => setOpen(!open)} className="p-2 -ml-2 text-gray-600" aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900 text-sm">CryptoLens</span>
        </Link>
        <LanguageSwitcher locale={locale} iconOnly mobile />
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />}

      <header className="hidden md:flex fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 items-center justify-between px-6 z-40">
        <h1 className="text-lg font-semibold text-gray-900">{t(titleKey, locale)}</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
            <span className="text-sm text-gray-600 max-w-40 truncate">{userName || t("user", locale)}</span>
          </div>
        </div>
      </header>

      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Search className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">CryptoLens</span>
          </Link>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.labelKey} className="mb-4">
              <p className="px-5 mb-1 text-[10px] tracking-[0.12em] uppercase text-gray-400">{t(section.labelKey, locale)}</p>
              <div className="space-y-0.5">
                {section.links.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={itemClass(l.href)}>
                      <Icon className="w-4 h-4" />
                      <span>{t(l.key, locale)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <Link href={settingsLink.href} onClick={() => setOpen(false)} className={itemClass(settingsLink.href)}>
            <Settings className="w-4 h-4" />
            <span>{t(settingsLink.key, locale)}</span>
          </Link>
          <div className="px-2">
            <LanguageSwitcher locale={locale} />
          </div>
          <div className="px-2">
            <p className="text-xs text-gray-400 mb-2 truncate">{userName || t("user", locale)}</p>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-gray-500 hover:text-gray-700 transition">{t("signOut", locale)}</button>
          </div>
        </div>
      </aside>
    </>
  );
}
