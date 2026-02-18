"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface DashboardTabsProps {
  locale: Locale;
  portfolioContent: React.ReactNode;
  marketContent: React.ReactNode;
  holdingsContent: React.ReactNode;
}

const tabs = [
  { key: "portfolio", icon: "💼" },
  { key: "market", icon: "🌍" },
  { key: "holdings", icon: "💰" },
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
      {/* Tab bar */}
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
              active === tab.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tabLabels[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "portfolio" && portfolioContent}
      {active === "market" && marketContent}
      {active === "holdings" && holdingsContent}
    </div>
  );
}
