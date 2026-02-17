export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { recordTransaction } from "@/lib/actions";
import Link from "next/link";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/");

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/holdings" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">Record Transaction</h1>
        </div>
        <form action={recordTransaction} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type *</label>
              <select name="type" required className={inputCls}><option value="BUY">BUY</option><option value="SELL">SELL</option></select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bucket *</label>
              <select name="bucket" required className={inputCls}><option value="long-term">Long-term</option><option value="short-term">Short-term</option></select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Coin ID (CoinGecko) *</label><input name="coinId" required placeholder="e.g. bitcoin" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Symbol *</label><input name="symbol" required placeholder="e.g. BTC" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Name *</label><input name="name" required placeholder="e.g. Bitcoin" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Quantity *</label><input name="quantity" type="number" step="any" required placeholder="0.001" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Price per Unit (USD) *</label><input name="pricePerUnit" type="number" step="any" required placeholder="68000" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Fee (USD)</label><input name="fee" type="number" step="any" defaultValue="0" className={inputCls} /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Notes</label><textarea name="notes" rows={2} className={inputCls} placeholder="Optional notes..." /></div>
          <button type="submit" className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">Record Transaction</button>
        </form>
      </main>
    </div>
  );
}
