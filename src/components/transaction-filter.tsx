"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface TransactionFilterProps {
  locale: Locale;
  types: string[];
  symbols: string[];
  onFilter: (type: string, symbol: string) => void;
}

export function TransactionFilter({ locale, types, symbols, onFilter }: TransactionFilterProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [symbolFilter, setSymbolFilter] = useState("all");

  const handleType = (v: string) => { setTypeFilter(v); onFilter(v, symbolFilter); };
  const handleSymbol = (v: string) => { setSymbolFilter(v); onFilter(typeFilter, v); };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Type pills */}
      <div className="flex gap-1.5">
        {["all", ...types].map((tp) => (
          <button
            key={tp}
            onClick={() => handleType(tp)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              typeFilter === tp
                ? tp === "BUY" ? "bg-emerald-600 text-white" : tp === "SELL" ? "bg-red-500 text-white" : "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tp === "all" ? t("all", locale) : tp === "BUY" ? t("buy", locale) : t("sell", locale)}
          </button>
        ))}
      </div>

      {/* Symbol dropdown */}
      {symbols.length > 1 && (
        <select
          value={symbolFilter}
          onChange={(e) => handleSymbol(e.target.value)}
          className="bg-gray-100 border-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600"
        >
          <option value="all">{t("all", locale)} {t("asset", locale)}</option>
          {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </div>
  );
}
