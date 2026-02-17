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
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Holdings</h1>
          <Link href="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition">+ Record Transaction</Link>
        </div>
        {enriched.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No holdings yet</p>
            <Link href="/transactions/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-500">Record your first transaction</Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Asset</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Bucket</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Quantity</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Avg Buy</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Current</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Value</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Cost</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">P&L</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">P&L %</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {enriched.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3"><span className="font-medium">{h.symbol}</span> <span className="text-gray-500 text-xs">{h.name}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${h.bucket === "long-term" ? "bg-blue-900/50 text-blue-400" : "bg-purple-900/50 text-purple-400"}`}>{h.bucket === "long-term" ? "Long" : "Short"}</span></td>
                      <td className="px-4 py-3 text-right text-gray-300">{h.quantity.toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">${h.avgBuyPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">${h.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">${h.currentValue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">${h.costBasis.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${h.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{h.unrealizedPnl >= 0 ? "+" : ""}${h.unrealizedPnl.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${h.unrealizedPnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>{h.unrealizedPnlPct >= 0 ? "+" : ""}{h.unrealizedPnlPct.toFixed(1)}%</td>
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
