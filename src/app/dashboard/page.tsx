export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings, costItems, tradeProposals, marketIndicators } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings, calcAllocation, calcPortfolioStats } from "@/lib/portfolio";
import { getTotalMonthlyCosts } from "@/lib/actions";
import Link from "next/link";

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
    ? fngValue <= 20 ? "text-red-500" : fngValue <= 40 ? "text-orange-400" : fngValue <= 60 ? "text-yellow-400" : "text-green-400"
    : "text-gray-500";

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          {pendingProposals.length > 0 && (
            <Link href="/proposals" className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-800 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-900/50 transition animate-pulse">
              ⚡ {pendingProposals.length} Pending Proposal{pendingProposals.length > 1 ? "s" : ""}
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Value" value={`$${stats.totalValue.toFixed(2)}`} />
          <StatCard label="Invested" value={`$${stats.totalCostBasis.toFixed(2)}`} />
          <StatCard label="Unrealized P&L" value={`$${stats.totalUnrealizedPnl.toFixed(2)}`} sub={`${stats.unrealizedPnlPct >= 0 ? "+" : ""}${stats.unrealizedPnlPct.toFixed(1)}%`} positive={stats.totalUnrealizedPnl >= 0} />
          <StatCard label="Net ROI" value={`${stats.netROI >= 0 ? "+" : ""}${stats.netROI.toFixed(1)}%`} sub={`Costs: $${monthlyCosts.toFixed(2)}/mo`} positive={stats.netROI >= 0} />
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase">Fear & Greed</p>
            {fngValue !== null ? (
              <>
                <p className={`text-xl font-bold mt-1 ${fngColor}`}>{fngValue}/100</p>
                <p className={`text-xs mt-1 ${fngColor} opacity-75`}>{fng.value_classification}</p>
              </>
            ) : (
              <p className="text-xl font-bold mt-1 text-gray-500">—</p>
            )}
          </div>
        </div>

        {/* Pending Proposals Banner */}
        {pendingProposals.length > 0 && (
          <div className="bg-gray-900 border border-yellow-800/50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-yellow-400 mb-3">⚡ Awaiting Your Decision</h2>
            <div className="space-y-2">
              {pendingProposals.map((p) => (
                <Link key={p.id} href="/proposals" className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3 hover:bg-gray-800 transition">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${p.action === "BUY" ? "text-green-400" : "text-red-400"}`}>{p.action}</span>
                    <span className="text-white font-medium">{p.symbol}</span>
                    <span className="text-gray-500 text-sm">{p.bucket}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{p.signal}</span>
                    <span className="text-white font-bold">{parseFloat(p.confluenceScore) >= 0 ? "+" : ""}{parseFloat(p.confluenceScore).toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Allocation & Movers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-gray-300 mb-4">Allocation (Target: 50/50)</h2>
            <div className="space-y-3">
              <AllocBar label="Long-term" pct={allocation.longTerm.pct} value={allocation.longTerm.value} color="blue" />
              <AllocBar label="Short-term" pct={allocation.shortTerm.pct} value={allocation.shortTerm.value} color="purple" />
            </div>
            {allocation.deviation > 10 && (
              <p className="text-yellow-400 text-sm mt-3">⚠️ Allocation deviation: {allocation.deviation.toFixed(1)}% from target</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-gray-300 mb-4">Top Movers</h2>
            {enriched.length === 0 ? (
              <p className="text-gray-500 text-sm">No holdings yet. Add your first position!</p>
            ) : (
              <div className="space-y-2">
                {topGainers.filter(h => h.unrealizedPnlPct > 0).map((h) => (
                  <div key={h.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{h.symbol} ({h.bucket === "long-term" ? "LT" : "ST"})</span>
                    <span className="text-green-400">+{h.unrealizedPnlPct.toFixed(1)}%</span>
                  </div>
                ))}
                {topLosers.filter(h => h.unrealizedPnlPct < 0).map((h) => (
                  <div key={h.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{h.symbol} ({h.bucket === "long-term" ? "LT" : "ST"})</span>
                    <span className="text-red-400">{h.unrealizedPnlPct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Wen's Indicators */}
        {indicators.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-gray-300 mb-4">📡 Market Indicators</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {indicators.map((ind) => (
                <div key={ind.id} className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{ind.indicatorName}</p>
                  <p className="text-lg font-bold text-white">{parseFloat(ind.value).toLocaleString()}</p>
                  {ind.signal && <p className="text-xs text-gray-400">{ind.signal}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Holdings Summary */}
        {enriched.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-300">Holdings</h2>
              <Link href="/holdings" className="text-sm text-gray-500 hover:text-gray-300">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-500 text-xs uppercase">Asset</th>
                    <th className="text-left px-4 py-2 text-gray-500 text-xs uppercase">Bucket</th>
                    <th className="text-right px-4 py-2 text-gray-500 text-xs uppercase">Qty</th>
                    <th className="text-right px-4 py-2 text-gray-500 text-xs uppercase">Price</th>
                    <th className="text-right px-4 py-2 text-gray-500 text-xs uppercase">Value</th>
                    <th className="text-right px-4 py-2 text-gray-500 text-xs uppercase">P&L</th>
                    <th className="text-right px-4 py-2 text-gray-500 text-xs uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {enriched.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium">{h.symbol} <span className="text-gray-500 text-xs">{h.name}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${h.bucket === "long-term" ? "bg-slate-800/50 text-slate-300" : "bg-gray-700/50 text-gray-400"}`}>{h.bucket === "long-term" ? "LT" : "ST"}</span></td>
                      <td className="px-4 py-3 text-right text-gray-300">{h.quantity.toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">${h.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${h.currentValue.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${h.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>${h.unrealizedPnl.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{h.portfolioPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className={`text-xl font-bold mt-1 ${positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-white"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${positive === true ? "text-green-400/70" : positive === false ? "text-red-400/70" : "text-gray-500"}`}>{sub}</p>}
    </div>
  );
}

function AllocBar({ label, pct, value, color }: { label: string; pct: number; value: number; color: string }) {
  const bg = color === "blue" ? "bg-slate-500" : "bg-gray-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{pct.toFixed(1)}% (${value.toFixed(2)})</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full"><div className={`h-2 ${bg} rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );
}
