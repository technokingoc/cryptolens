export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings } from "@/lib/portfolio";
import Link from "next/link";

export default async function HoldingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const allHoldings = await db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true)));
  const coinIds = [...new Set(allHoldings.map((h) => h.coinId))];
  const prices = await fetchAndCachePrices(coinIds);
  const enriched = enrichHoldings(allHoldings, prices);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Holdings</h1>
          <Link href="/transactions/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">+ Record Transaction</Link>
        </div>
        {enriched.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No holdings yet</p>
            <Link href="/transactions/new" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">Record your first transaction</Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {enriched.map((h) => (
                <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-900">{h.symbol}</span>
                      <span className="text-gray-400 text-xs ml-1">{h.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? "Long" : "Short"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-[11px] text-gray-400">Value</p><p className="font-medium text-gray-900">${h.currentValue.toFixed(2)}</p></div>
                    <div className="text-right"><p className="text-[11px] text-gray-400">P&L</p><p className={`font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</p></div>
                    <div><p className="text-[11px] text-gray-400">Qty</p><p className="text-gray-600">{h.quantity.toFixed(6)}</p></div>
                    <div className="text-right"><p className="text-[11px] text-gray-400">Weight</p><p className="text-gray-600">{h.portfolioPct.toFixed(1)}%</p></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Asset</th>
                      <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Bucket</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Quantity</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Avg Buy</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Current</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Value</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">P&L</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">P&L %</th>
                      <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enriched.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><span className="font-medium text-gray-900">{h.symbol}</span> <span className="text-gray-400 text-xs">{h.name}</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{h.bucket === "long-term" ? "Long" : "Short"}</span></td>
                        <td className="px-4 py-3 text-right text-gray-500">{h.quantity.toFixed(6)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">${h.avgBuyPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">${h.currentPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">${h.currentValue.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right ${h.unrealizedPnlPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.unrealizedPnlPct >= 0 ? "+" : ""}{h.unrealizedPnlPct.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-gray-400">{h.portfolioPct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
