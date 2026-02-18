"use client";

import { AlertTriangle, BellRing, TrendingDown, TrendingUp } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

function timeAgo(minutes: number, locale: Locale) {
  if (minutes < 1) return t("justNow", locale);
  if (minutes < 60) return `${minutes} ${t("minutesAgo", locale)}`;
  return `${Math.floor(minutes / 60)} ${t("hoursAgo", locale)}`;
}

export function AlertsCenter({ locale }: { locale: Locale }) {
  const priceAlerts = [
    { symbol: "BTC", dir: "up", target: 98000, minutesAgo: 18 },
    { symbol: "ETH", dir: "down", target: 2800, minutesAgo: 47 },
  ] as const;

  const riskAlerts = [
    { label: "SOL", textKey: "concentrationAlert" as const, minutesAgo: 52 },
    { label: "Portfolio", textKey: "volatilityWarning" as const, minutesAgo: 131 },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5"><BellRing className="w-4 h-4" />{t("alertsCenter", locale)}</h2>
        <p className="text-xs text-gray-400">{t("alertsCenterDesc", locale)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">{t("priceMoveAlerts", locale)}</p>
          <div className="space-y-2">
            {priceAlerts.map((a) => (
              <div key={`${a.symbol}-${a.target}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  {a.dir === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                  <span>{a.symbol} {a.dir === "up" ? t("alertAbove", locale) : t("alertBelow", locale)} ${a.target.toLocaleString()}</span>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(a.minutesAgo, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">{t("riskAlertsList", locale)}</p>
          <div className="space-y-2">
            {riskAlerts.map((a) => (
              <div key={`${a.label}-${a.minutesAgo}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{a.label}: {t(a.textKey, locale)}</span>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(a.minutesAgo, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
