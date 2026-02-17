export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings, calcAllocation } from "@/lib/portfolio";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⚠️ {t("riskDashboard", locale)}</h1>
          <LanguageSwitcher locale={locale} />
        </div>

        {enriched.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400">{t("noHoldingsToAnalyze", locale)}</p>
          </div>
        ) : (
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
                  <p className="text-amber-700 text-xs">⚠️ {t("deviation", locale)}: {allocation.deviation.toFixed(1)}%. {t("considerRebalancing", locale)}</p>
                </div>
              ) : (
                <p className="text-emerald-600 text-xs mt-4">✅ {t("withinRange", locale)} ({allocation.deviation.toFixed(1)}%)</p>
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
                    {c.pct > 30 && <p className="text-red-500 text-[11px] mt-0.5">⚠️ {t("highConcentration", locale)}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Full Exposure — Mobile cards + Desktop table */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
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
