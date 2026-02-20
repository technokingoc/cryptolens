"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Briefcase, Globe, Coins } from "lucide-react";

interface DashboardTabsProps {
  locale: Locale;
  portfolioContent: React.ReactNode;
  marketContent: React.ReactNode;
  holdingsContent: React.ReactNode;
}

const tabs = [
  { key: "portfolio", Icon: Briefcase },
  { key: "market", Icon: Globe },
  { key: "holdings", Icon: Coins },
] as const;

export function DashboardTabs({ locale, portfolioContent, marketContent, holdingsContent }: DashboardTabsProps) {
  const [active, setActive] = useState<string>("portfolio");

  const tabLabels: Record<string, string> = {
    portfolio: t("portfolio", locale),
    market: t("market", locale),
    holdings: t("holdings", locale),
  };

  return (
    <div className="md:hidden">
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
              active === tab.key ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <tab.Icon className="w-3.5 h-3.5" />
            <span>{tabLabels[tab.key]}</span>
          </button>
        ))}
      </div>
      {active === "portfolio" && portfolioContent}
      {active === "market" && marketContent}
      {active === "holdings" && holdingsContent}
    </div>
  );
}
