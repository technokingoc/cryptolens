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

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-2">Operating Costs</h1>
        <p className="text-gray-400 mb-6">Monthly burn: <span className="text-white font-semibold">${monthlyCost.toFixed(2)}/mo</span></p>

        <form action={addCostItem} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-300 mb-2">Add Cost Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="name" required placeholder="Name" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input name="amount" type="number" step="0.01" required placeholder="Amount (USD)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <select name="frequency" required className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="monthly">Monthly</option><option value="annual">Annual</option><option value="one-time">One-time</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="category" placeholder="Category" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input name="startDate" type="date" required className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input name="description" placeholder="Description" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500">Add Cost</button>
        </form>

        {items.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Category</th>
                  <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Frequency</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Start</th>
                  <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-400">{c.category ?? "—"}</td>
                    <td className="px-4 py-3 text-right">${parseFloat(c.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400">{c.frequency}</td>
                    <td className="px-4 py-3 text-gray-400">{c.startDate}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"}`}>{c.isActive ? "Active" : "Ended"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
