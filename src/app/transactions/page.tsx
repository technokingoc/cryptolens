export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { TransactionsClient } from "@/components/transactions-client";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const txs = await db.select().from(transactions).where(eq(transactions.userId, session.user.id)).orderBy(desc(transactions.tradedAt));

  const serialized = txs.map((tx) => ({
    id: tx.id,
    type: tx.type,
    symbol: tx.symbol,
    bucket: tx.bucket,
    quantity: tx.quantity,
    pricePerUnit: tx.pricePerUnit,
    totalValue: tx.totalValue,
    realizedPnl: tx.realizedPnl,
    tradedAt: tx.tradedAt?.toLocaleDateString() ?? "",
  }));

  const types = [...new Set(txs.map((tx) => tx.type))];
  const symbols = [...new Set(txs.map((tx) => tx.symbol))].sort();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
        <Breadcrumb items={[{ label: t("dashboard", locale), href: "/dashboard" }, { label: t("transactions", locale) }]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("transactions", locale)}</h1>
          <div className="flex items-center gap-2">
            <Link href="/transactions/new" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">+ {t("newTx", locale)}</Link>
          </div>
        </div>
        {txs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">{t("noTransactions", locale)}</p>
            <Link href="/transactions/new" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium">{t("recordFirst", locale)}</Link>
          </div>
        ) : (
          <TransactionsClient transactions={serialized} types={types} symbols={symbols} locale={locale} />
        )}
      </main>
    </div>
  );
}
