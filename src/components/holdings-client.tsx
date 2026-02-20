"use client";

import { useState, Fragment } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import type { HoldingWithPrice } from "@/lib/portfolio";

type Transaction = {
  id: string;
  type: string;
  quantity: string;
  pricePerUnit: string;
  totalValue: string;
  fee: string | null;
  notes: string | null;
  tradedAt: string;
};

type HoldingData = HoldingWithPrice & {
  transactions: Transaction[];
};

export function HoldingsTable({ holdings, locale }: { holdings: HoldingData[]; locale: Locale }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <>
      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {holdings.map((h) => (
          <div key={h.id}>
            <div
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer active:bg-gray-50 transition"
              onClick={() => toggle(h.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{h.symbol}</span>
                  <span className="text-gray-400 text-xs">{h.name}</span>
                  {expandedId === h.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? t("long", locale) : t("short", locale)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-[11px] text-gray-400">{t("value", locale)}</p><p className="font-medium text-gray-900">${h.currentValue.toFixed(2)}</p></div>
                <div className="text-right"><p className="text-[11px] text-gray-400">{t("pnl", locale)}</p><p className={`font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</p></div>
                <div><p className="text-[11px] text-gray-400">{t("quantity", locale)}</p><p className="text-gray-600">{h.quantity.toFixed(6)}</p></div>
                <div className="text-right"><p className="text-[11px] text-gray-400">{t("weight", locale)}</p><p className="text-gray-600">{h.portfolioPct.toFixed(1)}%</p></div>
              </div>
            </div>
            {expandedId === h.id && <DetailPanel holding={h} locale={locale} />}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("asset", locale)}</th>
                <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("bucket", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("quantity", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("avgBuy", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("current", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("value", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("pnl", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("pnlPct", locale)}</th>
                <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("weight", locale)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {holdings.map((h) => (
                <Fragment key={h.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer transition" onClick={() => toggle(h.id)}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{h.symbol}</span> <span className="text-gray-400 text-xs">{h.name}</span>
                      {expandedId === h.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? t("long", locale) : t("short", locale)}</span></td>
                    <td className="px-4 py-3 text-right text-gray-500">{h.quantity.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">${h.avgBuyPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${h.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">${h.currentValue.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right ${h.unrealizedPnlPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnlPct >= 0 ? "+" : ""}{h.unrealizedPnlPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-400">{h.portfolioPct.toFixed(1)}%</td>
                  </tr>
                  {expandedId === h.id && (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <DetailPanel holding={h} locale={locale} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function DetailPanel({ holding: h, locale }: { holding: HoldingData; locale: Locale }) {
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 sm:px-6 py-5 space-y-5">
      {/* Cost Basis Breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("costBasisBreakdown", locale)}</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-[10px] text-gray-400">{t("totalCostBasis", locale)}</p>
            <p className="text-sm font-semibold text-gray-900">${h.costBasis.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-[10px] text-gray-400">{t("avgCostPerUnit", locale)}</p>
            <p className="text-sm font-semibold text-gray-900">${h.avgBuyPrice.toFixed(4)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-[10px] text-gray-400">{t("totalQuantity", locale)}</p>
            <p className="text-sm font-semibold text-gray-900">{h.quantity.toFixed(6)}</p>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {t("purchaseHistory", locale)}
        </h3>
        {h.transactions.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("noTransactionsForAsset", locale)}</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Mobile tx list */}
            <div className="sm:hidden divide-y divide-gray-50">
              {h.transactions.map((tx) => (
                <div key={tx.id} className="p-3 flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${tx.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{tx.type === "BUY" ? t("buy", locale) : t("sell", locale)}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(tx.tradedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{parseFloat(tx.quantity).toFixed(6)} @ ${parseFloat(tx.pricePerUnit).toFixed(4)}</p>
                    <p className="text-xs text-gray-400">${parseFloat(tx.totalValue).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop tx table */}
            <table className="hidden sm:table w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="text-left px-3 py-2">{t("date", locale)}</th>
                  <th className="text-left px-3 py-2">{t("type", locale)}</th>
                  <th className="text-right px-3 py-2">{t("quantity", locale)}</th>
                  <th className="text-right px-3 py-2">{t("price", locale)}</th>
                  <th className="text-right px-3 py-2">{t("total", locale)}</th>
                  <th className="text-right px-3 py-2">{t("fee", locale)}</th>
                  <th className="text-left px-3 py-2">{t("notes", locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {h.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-3 py-2 text-gray-500">{new Date(tx.tradedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2"><span className={`font-medium ${tx.type === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{tx.type === "BUY" ? t("buy", locale) : t("sell", locale)}</span></td>
                    <td className="px-3 py-2 text-right text-gray-600">{parseFloat(tx.quantity).toFixed(6)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">${parseFloat(tx.pricePerUnit).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right text-gray-700 font-medium">${parseFloat(tx.totalValue).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{tx.fee ? `$${parseFloat(tx.fee).toFixed(2)}` : "—"}</td>
                    <td className="px-3 py-2 text-gray-400 max-w-[200px] truncate">{tx.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes field (display only, from last transaction notes) */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("holdingNotes", locale)}</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          {h.transactions.some((tx) => tx.notes) ? (
            <div className="space-y-1">
              {h.transactions.filter((tx) => tx.notes).map((tx) => (
                <p key={tx.id} className="text-sm text-gray-600">
                  <span className="text-gray-400 text-xs">{new Date(tx.tradedAt).toLocaleDateString()}:</span> {tx.notes}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">{t("notesPlaceholder", locale)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
