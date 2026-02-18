export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { recordTransaction } from "@/lib/actions";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/holdings" className="text-gray-400 hover:text-gray-600 text-sm">← {t("back", locale)}</Link>
            <h1 className="text-2xl font-bold text-gray-900">{t("recordTx", locale)}</h1>
          </div>
        </div>
        <form action={recordTransaction} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">{t("type", locale)} *</label><select name="type" required className={inputCls}><option value="BUY">{t("buy", locale)}</option><option value="SELL">{t("sell", locale)}</option></select></div>
            <div><label className="block text-xs text-gray-500 mb-1">{t("bucket", locale)} *</label><select name="bucket" required className={inputCls}><option value="long-term">{t("longTerm", locale)}</option><option value="short-term">{t("shortTerm", locale)}</option></select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">{t("coinId", locale)} *</label><input name="coinId" required placeholder="e.g. bitcoin" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">{t("symbol", locale)} *</label><input name="symbol" required placeholder="e.g. BTC" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">{t("name", locale)} *</label><input name="name" required placeholder="e.g. Bitcoin" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">{t("quantity", locale)} *</label><input name="quantity" type="number" step="any" required placeholder="0.001" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">{t("price", locale)} (USD) *</label><input name="pricePerUnit" type="number" step="any" required placeholder="68000" className={inputCls} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Fee (USD)</label><input name="fee" type="number" step="any" defaultValue="0" className={inputCls} /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">{t("notes", locale)}</label><textarea name="notes" rows={2} className={inputCls} placeholder={t("optionalNotes", locale)} /></div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">{t("recordTx", locale)}</button>
        </form>
      </main>
    </div>
  );
}
