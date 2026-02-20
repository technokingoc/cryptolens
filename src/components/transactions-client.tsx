"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Tx {
  id: string;
  type: string;
  symbol: string;
  bucket: string;
  quantity: string;
  pricePerUnit: string;
  totalValue: string;
  realizedPnl: string | null;
  tradedAt: string;
}

interface Props {
  transactions: Tx[];
  types: string[];
  symbols: string[];
  locale: Locale;
}

export function TransactionsClient({ transactions, types, symbols, locale }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [symbolFilter, setSymbolFilter] = useState("all");

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (symbolFilter !== "all" && tx.symbol !== symbolFilter) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1.5">
          {["all", ...types].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                typeFilter === tp
                  ? tp === "BUY" ? "bg-emerald-600 text-white" : tp === "SELL" ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tp === "all" ? t("all", locale) : tp} ({tp === "all" ? transactions.length : transactions.filter((tx) => tx.type === tp).length})
            </button>
          ))}
        </div>
        {symbols.length > 1 && (
          <select
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="bg-gray-100 border-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            <option value="all">{t("all", locale)} {t("asset", locale)}</option>
            {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400">{t("noTransactions", locale)}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((tx) => (
              <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{tx.type}</span>
                    <span className="font-medium text-gray-900">{tx.symbol}</span>
                  </div>
                  <span className="text-xs text-gray-400">{tx.tradedAt}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-[11px] text-gray-400">{t("quantity", locale)}</p><p className="text-gray-600">{parseFloat(tx.quantity).toFixed(6)}</p></div>
                  <div className="text-right"><p className="text-[11px] text-gray-400">{t("total", locale)}</p><p className="text-gray-900 font-medium">${parseFloat(tx.totalValue).toFixed(2)}</p></div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("date", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("type", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("asset", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("bucket", locale)}</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("quantity", locale)}</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("price", locale)}</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("total", locale)}</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("pnl", locale)}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{tx.tradedAt}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{tx.type}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-900">{tx.symbol}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{tx.bucket === "long-term" ? "LT" : "ST"}</span></td>
                      <td className="px-4 py-3 text-right text-gray-500">{parseFloat(tx.quantity).toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">${parseFloat(tx.pricePerUnit).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">${parseFloat(tx.totalValue).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${tx.realizedPnl ? (parseFloat(tx.realizedPnl) >= 0 ? "text-emerald-600" : "text-red-500") : "text-gray-300"}`}>{tx.realizedPnl ? `$${parseFloat(tx.realizedPnl).toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
