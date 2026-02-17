export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings, calcAllocation } from "@/lib/portfolio";

export default async function RiskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const allHoldings = await db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true)));
  const coinIds = [...new Set(allHoldings.map((h) => h.coinId))];
  const prices = await fetchAndCachePrices(coinIds);
  const enriched = enrichHoldings(allHoldings, prices);
  const allocation = calcAllocation(enriched);

  // Aggregate by coin (across buckets)
  const byCoin = new Map<string, { symbol: string; name: string; totalValue: number; pct: number }>();
  for (const h of enriched) {
    const existing = byCoin.get(h.coinId) || { symbol: h.symbol, name: h.name, totalValue: 0, pct: 0 };
    existing.totalValue += h.currentValue;
    byCoin.set(h.coinId, existing);
  }
  const coinExposure = [...byCoin.entries()].map(([coinId, d]) => ({
    coinId, ...d, pct: allocation.totalValue > 0 ? (d.totalValue / allocation.totalValue) * 100 : 0,
  })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Risk Dashboard</h1>

        {enriched.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500">No holdings to analyze. Add positions first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bucket Balance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-gray-300 mb-4">Bucket Balance (Target: 50/50)</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Long-term</span>
                    <span className="text-gray-300">{allocation.longTerm.pct.toFixed(1)}% (${allocation.longTerm.value.toFixed(2)})</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.min(100, allocation.longTerm.pct)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Short-term</span>
                    <span className="text-gray-300">{allocation.shortTerm.pct.toFixed(1)}% (${allocation.shortTerm.value.toFixed(2)})</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${Math.min(100, allocation.shortTerm.pct)}%` }} />
                  </div>
                </div>
              </div>
              {allocation.deviation > 10 && (
                <div className="mt-4 bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">⚠️ Deviation: {allocation.deviation.toFixed(1)}% from 50/50 target. Consider rebalancing.</p>
                </div>
              )}
              {allocation.deviation <= 10 && (
                <p className="text-green-400 text-sm mt-4">✅ Allocation within acceptable range ({allocation.deviation.toFixed(1)}% deviation)</p>
              )}
            </div>

            {/* Concentration Risk */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-gray-300 mb-4">Concentration Risk</h2>
              <div className="space-y-3">
                {coinExposure.map((c) => (
                  <div key={c.coinId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{c.symbol} <span className="text-gray-600">{c.name}</span></span>
                      <span className={c.pct > 30 ? "text-red-400 font-medium" : "text-gray-400"}>{c.pct.toFixed(1)}% (${c.totalValue.toFixed(2)})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full">
                      <div className={`h-2 rounded-full ${c.pct > 30 ? "bg-red-500" : c.pct > 20 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, c.pct)}%` }} />
                    </div>
                    {c.pct > 30 && <p className="text-red-400 text-xs mt-1">⚠️ High concentration (&gt;30%)</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Exposure Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-2">
              <h2 className="font-semibold text-gray-300 mb-4">Full Exposure Table</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 text-gray-500 text-xs uppercase">Asset</th>
                    <th className="text-left pb-2 text-gray-500 text-xs uppercase">Bucket</th>
                    <th className="text-right pb-2 text-gray-500 text-xs uppercase">Value</th>
                    <th className="text-right pb-2 text-gray-500 text-xs uppercase">% Portfolio</th>
                    <th className="text-right pb-2 text-gray-500 text-xs uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {enriched.sort((a, b) => b.currentValue - a.currentValue).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2 font-medium">{h.symbol}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${h.bucket === "long-term" ? "bg-slate-800/50 text-slate-300" : "bg-gray-700/50 text-gray-400"}`}>{h.bucket === "long-term" ? "LT" : "ST"}</span></td>
                      <td className="py-2 text-right">${h.currentValue.toFixed(2)}</td>
                      <td className="py-2 text-right text-gray-400">{h.portfolioPct.toFixed(1)}%</td>
                      <td className={`py-2 text-right ${h.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
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
