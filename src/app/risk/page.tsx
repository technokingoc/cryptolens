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
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚠️ Risk Dashboard</h1>

        {enriched.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400">No holdings to analyze.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Bucket Balance */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 text-sm">Bucket Balance (Target: 50/50)</h2>
              <div className="space-y-4">
                <Bar label="Long-term" pct={allocation.longTerm.pct} value={allocation.longTerm.value} />
                <Bar label="Short-term" pct={allocation.shortTerm.pct} value={allocation.shortTerm.value} />
              </div>
              {allocation.deviation > 10 ? (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 text-xs">⚠️ Deviation: {allocation.deviation.toFixed(1)}% from 50/50 target. Consider rebalancing.</p>
                </div>
              ) : (
                <p className="text-emerald-600 text-xs mt-4">✅ Within acceptable range ({allocation.deviation.toFixed(1)}% deviation)</p>
              )}
            </div>

            {/* Concentration */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 text-sm">Concentration Risk</h2>
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
                    {c.pct > 30 && <p className="text-red-500 text-[11px] mt-0.5">⚠️ High concentration (&gt;30%)</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Full Table */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-700 mb-4 text-sm">Full Exposure</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-[11px] text-gray-400 uppercase tracking-wide">Asset</th>
                    <th className="text-left pb-2 text-[11px] text-gray-400 uppercase tracking-wide">Bucket</th>
                    <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">Value</th>
                    <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">Weight</th>
                    <th className="text-right pb-2 text-[11px] text-gray-400 uppercase tracking-wide">P&L</th>
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
