export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { recordTransaction } from "@/lib/actions";
import Link from "next/link";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/holdings" className="text-gray-500 hover:text-gray-300">← Back</Link>
          <h1 className="text-2xl font-bold">Record Transaction</h1>
        </div>
        <form action={recordTransaction} className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type *</label>
              <select name="type" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="BUY">BUY</option><option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bucket *</label>
              <select name="bucket" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="long-term">Long-term</option><option value="short-term">Short-term</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coin ID (CoinGecko) *</label>
              <input name="coinId" required placeholder="e.g. bitcoin" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Symbol *</label>
              <input name="symbol" required placeholder="e.g. BTC" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input name="name" required placeholder="e.g. Bitcoin" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity *</label>
              <input name="quantity" type="number" step="any" required placeholder="0.001" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price per Unit (USD) *</label>
              <input name="pricePerUnit" type="number" step="any" required placeholder="68000" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fee (USD)</label>
              <input name="fee" type="number" step="any" defaultValue="0" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea name="notes" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Optional notes..." />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-500 transition">Record Transaction</button>
        </form>
      </main>
    </div>
  );
}
