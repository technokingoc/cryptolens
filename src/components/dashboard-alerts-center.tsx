"use client";

import { useMemo, useState } from "react";
import { BellRing, ShieldAlert } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type AlertRow = { id: string; symbol: string; direction: "up" | "down"; threshold: number; enabled: boolean };

export function DashboardAlertsCenter({ locale, symbols }: { locale: Locale; symbols: string[] }) {
  const [rows, setRows] = useState<AlertRow[]>([
    { id: "1", symbol: symbols[0] || "BTC", direction: "up", threshold: 5, enabled: true },
    { id: "2", symbol: symbols[1] || "ETH", direction: "down", threshold: 4, enabled: true },
  ]);

  const addMockAlert = () => {
    const fallback = ["SOL", "ARB", "LINK"];
    const symbol = symbols[rows.length % Math.max(symbols.length, 1)] || fallback[rows.length % fallback.length];
    setRows((prev) => [{ id: `${Date.now()}`, symbol, direction: prev.length % 2 === 0 ? "up" : "down", threshold: 3 + (prev.length % 5), enabled: true }, ...prev]);
  };

  const riskAlerts = useMemo(() => [
    { id: "r1", text: t("portfolioRiskHigh", locale), severity: "high" },
    { id: "r2", text: t("exposureWarning", locale), severity: "medium" },
    { id: "r3", text: t("volatilityWarning", locale), severity: "medium" },
  ], [locale]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl density-card-lg p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><BellRing className="w-4 h-4" />{t("alertsCenter", locale)}</h2>
        <button onClick={addMockAlert} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition self-start sm:self-auto">
          {t("createMockAlert", locale)}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 density-gap">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t("priceMoveAlerts", locale)}</p>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg bg-gray-50 density-card px-3 py-2 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900 mr-2">{row.symbol}</span>
                  {row.direction === "up" ? t("thresholdUp", locale) : t("thresholdDown", locale)} {row.threshold}%
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${row.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {row.enabled ? t("enabled", locale) : t("disabled", locale)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{t("riskAlertsList", locale)}</p>
          <div className="space-y-2">
            {riskAlerts.map((risk) => (
              <div key={risk.id} className={`rounded-lg density-card px-3 py-2 text-sm border ${risk.severity === "high" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {risk.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
