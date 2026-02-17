export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const txs = await db.select().from(transactions).where(eq(transactions.userId, session.user.id)).orderBy(desc(transactions.tradedAt));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <Link href="/transactions/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">+ New</Link>
        </div>
        {txs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No transactions yet</p>
            <Link href="/transactions/new" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium">Record First Transaction</Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {txs.map((t) => (
                <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{t.type}</span>
                      <span className="font-medium text-gray-900">{t.symbol}</span>
                    </div>
                    <span className="text-xs text-gray-400">{t.tradedAt?.toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-[11px] text-gray-400">Qty</p><p className="text-gray-600">{parseFloat(t.quantity).toFixed(6)}</p></div>
                    <div className="text-right"><p className="text-[11px] text-gray-400">Total</p><p className="text-gray-900 font-medium">${parseFloat(t.totalValue).toFixed(2)}</p></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Asset</th>
                    <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Bucket</th>
                    <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Price</th>
                    <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">P&L</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {txs.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{t.tradedAt?.toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{t.type}</span></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{t.symbol}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{t.bucket === "long-term" ? "LT" : "ST"}</span></td>
                        <td className="px-4 py-3 text-right text-gray-500">{parseFloat(t.quantity).toFixed(6)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">${parseFloat(t.pricePerUnit).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">${parseFloat(t.totalValue).toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right ${t.realizedPnl ? (parseFloat(t.realizedPnl) >= 0 ? "text-emerald-600" : "text-red-500") : "text-gray-300"}`}>{t.realizedPnl ? `$${parseFloat(t.realizedPnl).toFixed(2)}` : "—"}</td>
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
