export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings, tradeProposals, marketIndicators } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings, calcAllocation, calcPortfolioStats } from "@/lib/portfolio";
import { getTotalMonthlyCosts } from "@/lib/actions";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";
import { Zap, AlertTriangle, Radio } from "lucide-react";

async function fetchFearGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 300 } });
    const data = await res.json();
    return data?.data?.[0] ?? null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const [allHoldings, pendingProposals, indicators, fng] = await Promise.all([
    db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true))),
    db.select().from(tradeProposals).where(and(eq(tradeProposals.userId, session.user.id), eq(tradeProposals.status, "pending"))),
    db.select().from(marketIndicators),
    fetchFearGreed(),
  ]);

  const coinIds = [...new Set(allHoldings.map((h) => h.coinId))];
  const prices = await fetchAndCachePrices(coinIds);
  const enriched = enrichHoldings(allHoldings, prices);
  const allocation = calcAllocation(enriched);
  const monthlyCosts = await getTotalMonthlyCosts(session.user.id);
  const stats = calcPortfolioStats(enriched, monthlyCosts);

  const topGainers = [...enriched].sort((a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct).slice(0, 3);
  const topLosers = [...enriched].sort((a, b) => a.unrealizedPnlPct - b.unrealizedPnlPct).slice(0, 3);

  const fngValue = fng ? parseInt(fng.value) : null;
  const fngColor = fngValue !== null
    ? fngValue <= 20 ? "text-red-500" : fngValue <= 40 ? "text-orange-500" : fngValue <= 60 ? "text-yellow-600" : "text-emerald-600"
    : "text-gray-400";

  // --- Shared sections as JSX ---

  const statsSection = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
      <StatCard label={t("totalValue", locale)} value={`$${stats.totalValue.toFixed(2)}`} />
      <StatCard label={t("invested", locale)} value={`$${stats.totalCostBasis.toFixed(2)}`} />
      <StatCard label={t("unrealizedPnl", locale)} value={`$${stats.totalUnrealizedPnl.toFixed(2)}`} sub={`${stats.unrealizedPnlPct >= 0 ? "+" : ""}${stats.unrealizedPnlPct.toFixed(1)}%`} positive={stats.totalUnrealizedPnl >= 0} />
      <StatCard label={t("netROI", locale)} value={`${stats.netROI >= 0 ? "+" : ""}${stats.netROI.toFixed(1)}%`} sub={`${t("costs", locale)}: $${monthlyCosts.toFixed(2)}/mo`} positive={stats.netROI >= 0} />
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("fearGreed", locale)}</p>
        {fngValue !== null ? (
          <>
            <p className={`text-xl font-bold mt-1 ${fngColor}`}>{fngValue}/100</p>
            <p className={`text-xs mt-0.5 ${fngColor} opacity-75`}>{fng.value_classification}</p>
          </>
        ) : <p className="text-xl font-bold mt-1 text-gray-300">—</p>}
      </div>
    </div>
  );

  const pendingSection = pendingProposals.length > 0 ? (
    <div className="bg-white border border-amber-200 rounded-xl p-4 mb-6">
      <h2 className="font-semibold text-amber-700 mb-3 text-sm flex items-center gap-1.5"><Zap className="w-4 h-4" /> {t("awaitingDecision", locale)}</h2>
      <div className="space-y-2">
        {pendingProposals.map((p) => (
          <Link key={p.id} href="/proposals" className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${p.action === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{p.action}</span>
              <span className="text-gray-900 font-medium text-sm">{p.symbol}</span>
              <span className="text-gray-400 text-xs hidden sm:inline">{p.bucket}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">{p.signal}</span>
              <span className="text-sm text-gray-900 font-bold">{parseFloat(p.confluenceScore) >= 0 ? "+" : ""}{parseFloat(p.confluenceScore).toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  const portfolioSection = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">{t("allocation", locale)} ({t("targetBalance", locale)})</h2>
        <div className="space-y-3">
          <AllocBar label={t("longTerm", locale)} pct={allocation.longTerm.pct} value={allocation.longTerm.value} color="gray" />
          <AllocBar label={t("shortTerm", locale)} pct={allocation.shortTerm.pct} value={allocation.shortTerm.value} color="light" />
        </div>
        {allocation.deviation > 10 && (
          <p className="text-amber-600 text-xs mt-3 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t("deviation", locale)}: {allocation.deviation.toFixed(1)}%</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">{t("topMovers", locale)}</h2>
        {enriched.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("noHoldings", locale)}</p>
        ) : (
          <div className="space-y-2">
            {topGainers.filter(h => h.unrealizedPnlPct > 0).map((h) => (
              <div key={h.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{h.symbol} <span className="text-gray-400 text-xs">{h.bucket === "long-term" ? "LT" : "ST"}</span></span>
                <span className="text-emerald-600 font-medium">+{h.unrealizedPnlPct.toFixed(1)}%</span>
              </div>
            ))}
            {topLosers.filter(h => h.unrealizedPnlPct < 0).map((h) => (
              <div key={h.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{h.symbol} <span className="text-gray-400 text-xs">{h.bucket === "long-term" ? "LT" : "ST"}</span></span>
                <span className="text-red-500 font-medium">{h.unrealizedPnlPct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const marketSection = indicators.length > 0 ? (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h2 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><Radio className="w-4 h-4" /> {t("marketIndicators", locale)}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {indicators.map((ind) => (
          <div key={ind.id} className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 truncate">{ind.indicatorName}</p>
            <p className="text-lg font-bold text-gray-900">{parseFloat(ind.value).toLocaleString()}</p>
            {ind.signal && <p className="text-[11px] text-gray-500 truncate">{ind.signal}</p>}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const holdingsSection = enriched.length > 0 ? (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-sm">{t("holdings", locale)}</h2>
        <Link href="/holdings" className="text-xs text-gray-400 hover:text-gray-600">{t("viewAll", locale)} →</Link>
      </div>
      {/* Mobile cards */}
      <div className="sm:hidden p-3 space-y-2">
        {enriched.map((h) => (
          <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <span className="font-medium text-gray-900 text-sm">{h.symbol}</span>
              <span className="text-gray-400 text-xs ml-1">{h.bucket === "long-term" ? "LT" : "ST"}</span>
              <p className="text-xs text-gray-500">${h.currentValue.toFixed(2)}</p>
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
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("asset", locale)}</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden sm:table-cell">{t("bucket", locale)}</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden md:table-cell">{t("quantity", locale)}</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("price", locale)}</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("value", locale)}</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("pnl", locale)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {enriched.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{h.symbol} <span className="text-gray-400 text-xs">{h.name}</span></td>
                <td className="px-4 py-3 hidden sm:table-cell"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? t("long", locale) : t("short", locale)}</span></td>
                <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{h.quantity.toFixed(6)}</td>
                <td className="px-4 py-3 text-right text-gray-600">${h.currentPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-medium">${h.currentValue.toFixed(2)}</td>
                <td className={`px-4 py-3 text-right font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard", locale)}</h1>
          <div className="flex items-center gap-3">
            {pendingProposals.length > 0 && (
              <Link href="/proposals" className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition">
                <Zap className="w-4 h-4" /> {pendingProposals.length} {t("pendingProposals", locale)}
              </Link>
            )}
          </div>
        </div>

        {/* Stats — always visible */}
        {statsSection}

        {/* Pending proposals — always visible */}
        {pendingSection}

        {/* Mobile: Tabbed content */}
        <DashboardTabs
          locale={locale}
          portfolioContent={<>{portfolioSection}</>}
          marketContent={<>{marketSection}</>}
          holdingsContent={<>{holdingsSection}</>}
        />

        {/* Desktop: Full layout */}
        <div className="hidden md:block">
          {portfolioSection}
          {marketSection}
          {holdingsSection}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${positive === true ? "text-emerald-600" : positive === false ? "text-red-500" : "text-gray-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${positive === true ? "text-emerald-500" : positive === false ? "text-red-400" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

function AllocBar({ label, pct, value, color }: { label: string; pct: number; value: number; color: string }) {
  const bg = color === "gray" ? "bg-gray-600" : "bg-gray-300";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-700">{pct.toFixed(1)}% (${value.toFixed(2)})</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full"><div className={`h-2 ${bg} rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );
}
