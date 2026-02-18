export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings, calcAllocation } from "@/lib/portfolio";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Link2 } from "lucide-react";

export default async function RiskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const allHoldings = await db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true)));
  const coinIds = [...new Set(allHoldings.map((h) => h.coinId))];
  const prices = await fetchAndCachePrices(coinIds);
  const enriched = enrichHoldings(allHoldings, prices);
  const allocation = calcAllocation(enriched);

  const byCoin = new Map<string, { symbol: string; name: string; totalValue: number }>();
  for (const h of enriched) {
    const e = byCoin.get(h.coinId) || { symbol: h.symbol, name: h.name, totalValue: 0 };
    e.totalValue += h.currentValue;
    byCoin.set(h.coinId, e);
  }
  const coinExposure = [...byCoin.entries()].map(([coinId, d]) => ({
    coinId, ...d, pct: allocation.totalValue > 0 ? (d.totalValue / allocation.totalValue) * 100 : 0,
  })).sort((a, b) => b.pct - a.pct);

  // Concentration warnings (>30%)
  const concentrationWarnings = coinExposure.filter((c) => c.pct > 30);

  // Risk score calculation
  const concentrationScore = Math.min(100, coinExposure.length > 0 ? coinExposure[0].pct * 1.5 : 0);
  const balanceScore = Math.min(100, allocation.deviation * 2);
  const diversificationScore = Math.max(0, 100 - (coinExposure.length * 15));
  const overallRisk = Math.round((concentrationScore * 0.4 + balanceScore * 0.3 + diversificationScore * 0.3));
  const riskLevel = overallRisk <= 33 ? "low" : overallRisk <= 66 ? "medium" : "high";
  const riskColor = riskLevel === "low" ? "text-emerald-600" : riskLevel === "medium" ? "text-amber-600" : "text-red-500";
  const riskBg = riskLevel === "low" ? "bg-emerald-50 border-emerald-200" : riskLevel === "medium" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const riskLabel = riskLevel === "low" ? t("lowRisk", locale) : riskLevel === "medium" ? t("mediumRisk", locale) : t("highRisk", locale);

  // Correlation groups (crypto-specific: all crypto assets are somewhat correlated)
  const cryptoGroup = coinExposure.filter((c) => c.pct > 5);
  const hasCorrelationRisk = cryptoGroup.length >= 3;

  const crumbs = [
    { label: t("dashboard", locale), href: "/dashboard" },
    { label: t("riskDashboard", locale) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <Breadcrumb items={crumbs} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-gray-400" /> {t("riskDashboard", locale)}</h1>
        </div>

        {enriched.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400">{t("noHoldingsToAnalyze", locale)}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Risk Score Summary Card */}
            <div className={`border rounded-xl p-6 ${riskBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> {t("riskScoreSummary", locale)}
                  </h2>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl font-bold ${riskColor}`}>{overallRisk}</span>
                    <span className="text-lg text-gray-500">/ 100</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskColor} bg-white/60`}>{riskLabel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("concentrationFactor", locale)}</p>
                    <p className={`text-lg font-semibold ${concentrationScore > 50 ? "text-red-500" : concentrationScore > 30 ? "text-amber-600" : "text-emerald-600"}`}>{Math.round(concentrationScore)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("balanceFactor", locale)}</p>
                    <p className={`text-lg font-semibold ${balanceScore > 50 ? "text-red-500" : balanceScore > 30 ? "text-amber-600" : "text-emerald-600"}`}>{Math.round(balanceScore)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("diversificationFactor", locale)}</p>
                    <p className={`text-lg font-semibold ${diversificationScore > 50 ? "text-red-500" : diversificationScore > 30 ? "text-amber-600" : "text-emerald-600"}`}>{Math.round(diversificationScore)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Concentration Warnings */}
            {concentrationWarnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h2 className="font-semibold text-red-700 mb-3 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {t("concentrationWarnings", locale)}
                </h2>
                <div className="space-y-2">
                  {concentrationWarnings.map((c) => (
                    <div key={c.coinId} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <span className="font-medium text-gray-900">{c.symbol} <span className="text-gray-400 text-xs">{c.name}</span></span>
                      <span className="text-red-600 font-semibold">{c.pct.toFixed(1)}% — {t("assetExceeds30", locale)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Bucket Balance */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-700 mb-4 text-sm">{t("bucketBalance", locale)} ({t("targetBalance", locale)})</h2>
                <div className="space-y-4">
                  <Bar label={t("longTerm", locale)} pct={allocation.longTerm.pct} value={allocation.longTerm.value} />
                  <Bar label={t("shortTerm", locale)} pct={allocation.shortTerm.pct} value={allocation.shortTerm.value} />
                </div>
                {allocation.deviation > 10 ? (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-700 text-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t("deviation", locale)}: {allocation.deviation.toFixed(1)}%. {t("considerRebalancing", locale)}</p>
                  </div>
                ) : (
                  <p className="text-emerald-600 text-xs mt-4 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t("withinRange", locale)} ({allocation.deviation.toFixed(1)}%)</p>
                )}
              </div>

              {/* Correlation Risk */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-400" /> {t("correlationRisk", locale)}
                </h2>
                <p className="text-xs text-gray-400 mb-4">{t("correlationNote", locale)}</p>
                {hasCorrelationRisk ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-700 text-xs font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {t("highCorrelation", locale)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cryptoGroup.map((c) => (
                        <span key={c.coinId} className="px-2 py-0.5 rounded text-xs bg-white border border-amber-200 text-amber-700">{c.symbol} ({c.pct.toFixed(0)}%)</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t("diversified", locale)}</p>
                )}
              </div>

              {/* Concentration */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-700 mb-4 text-sm">{t("concentrationRisk", locale)}</h2>
                <div className="space-y-3">
                  {coinExposure.map((c) => (
                    <div key={c.coinId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{c.symbol} <span className="text-gray-400 text-xs">{c.name}</span></span>
                        <span className={c.pct > 30 ? "text-red-500 font-medium" : "text-gray-500"}>{c.pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${c.pct > 30 ? "bg-red-400" : c.pct > 20 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, c.pct)}%` }} />
                      </div>
                      {c.pct > 30 && <p className="text-red-500 text-[11px] mt-0.5 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {t("highConcentration", locale)}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Exposure */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-700 mb-4 text-sm">{t("fullExposure", locale)}</h2>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {enriched.sort((a, b) => b.currentValue - a.currentValue).map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{h.symbol}</span>
                        <span className="text-gray-400 text-xs ml-1">{h.bucket === "long-term" ? "LT" : "ST"}</span>
                        <p className="text-xs text-gray-500">${h.currentValue.toFixed(2)} · {h.portfolioPct.toFixed(1)}%</p>
                      </div>
                      <span className={`text-sm font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-[11px] text-gray-400 uppercase tracking-wide">{t("asset", locale)}</th>
                      <th className="text-left pb-2 text-[11px] text-gray-400 uppercase tracking-wide">{t("bucket", locale)}</th>
                      <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">{t("value", locale)}</th>
                      <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">{t("weight", locale)}</th>
                      <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">{t("pnl", locale)}</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {enriched.sort((a, b) => b.currentValue - a.currentValue).map((h) => (
                        <tr key={h.id}>
                          <td className="py-2 font-medium text-gray-900">{h.symbol}</td>
                          <td className="py-2"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? "LT" : "ST"}</span></td>
                          <td className="py-2 text-right text-gray-700">${h.currentValue.toFixed(2)}</td>
                          <td className="py-2 text-right text-gray-500">{h.portfolioPct.toFixed(1)}%</td>
                          <td className={`py-2 text-right ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Bar({ label, pct, value }: { label: string; pct: number; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-700">{pct.toFixed(1)}% (${value.toFixed(2)})</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
