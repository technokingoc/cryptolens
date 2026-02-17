export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { costItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { addCostItem, getTotalMonthlyCosts } from "@/lib/actions";

export default async function CostsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const items = await db.select().from(costItems).where(eq(costItems.userId, session.user.id)).orderBy(desc(costItems.createdAt));
  const monthlyCost = await getTotalMonthlyCosts(session.user.id);
  const inputCls = "bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Operating Costs</h1>
        <p className="text-gray-500 text-sm mb-6">Monthly burn: <span className="text-gray-900 font-semibold">${monthlyCost.toFixed(2)}/mo</span></p>

        <form action={addCostItem} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm mb-2">Add Cost Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="name" required placeholder="Name" className={inputCls} />
            <input name="amount" type="number" step="0.01" required placeholder="Amount (USD)" className={inputCls} />
            <select name="frequency" required className={inputCls}><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="one-time">One-time</option></select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="category" placeholder="Category" className={inputCls} />
            <input name="startDate" type="date" required className={inputCls} />
            <input name="description" placeholder="Description" className={inputCls} />
          </div>
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Add Cost</button>
        </form>

        {items.length > 0 && (
          <>
            {/* Mobile */}
            <div className="sm:hidden space-y-3">
              {items.map((c) => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{c.isActive ? "Active" : "Ended"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{c.frequency}</span>
                    <span className="text-gray-900 font-medium">${parseFloat(c.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Frequency</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.category ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${parseFloat(c.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{c.frequency}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{c.isActive ? "Active" : "Ended"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
