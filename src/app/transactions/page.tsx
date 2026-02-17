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
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <Link href="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition">+ New</Link>
        </div>
        {txs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-4">No transactions recorded yet</p>
            <Link href="/transactions/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">Record First Transaction</Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Asset</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Bucket</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Qty</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Price</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Total</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">P&L</th>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {txs.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-gray-400">{t.tradedAt?.toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === "BUY" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>{t.type}</span></td>
                      <td className="px-4 py-3 font-medium">{t.symbol}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${t.bucket === "long-term" ? "bg-blue-900/50 text-blue-400" : "bg-purple-900/50 text-purple-400"}`}>{t.bucket === "long-term" ? "LT" : "ST"}</span></td>
                      <td className="px-4 py-3 text-right text-gray-300">{parseFloat(t.quantity).toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">${parseFloat(t.pricePerUnit).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${parseFloat(t.totalValue).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${t.realizedPnl ? (parseFloat(t.realizedPnl) >= 0 ? "text-green-400" : "text-red-400") : "text-gray-600"}`}>{t.realizedPnl ? `$${parseFloat(t.realizedPnl).toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">{t.notes ?? "—"}</td>
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
