export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { holdings, transactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { HoldingsTable } from "@/components/holdings-client";
import { fetchAndCachePrices } from "@/lib/market";
import { enrichHoldings } from "@/lib/portfolio";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function HoldingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const allHoldings = await db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true)));
  const coinIds = [...new Set(allHoldings.map((h) => h.coinId))];
  const prices = await fetchAndCachePrices(coinIds);
  const enriched = enrichHoldings(allHoldings, prices);

  // Fetch all transactions for this user to attach to holdings
  const allTx = await db.select().from(transactions).where(eq(transactions.userId, session.user.id)).orderBy(desc(transactions.tradedAt));

  const holdingsWithTx = enriched.map((h) => ({
    ...h,
    transactions: allTx
      .filter((tx) => tx.holdingId === h.id)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        quantity: tx.quantity,
        pricePerUnit: tx.pricePerUnit,
        totalValue: tx.totalValue,
        fee: tx.fee,
        notes: tx.notes,
        tradedAt: tx.tradedAt.toISOString(),
      })),
  }));

  const crumbs = [
    { label: t("dashboard", locale), href: "/dashboard" },
    { label: t("holdings", locale) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
        <Breadcrumb items={crumbs} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("holdings", locale)}</h1>
          <div className="flex items-center gap-2">
            <Link href="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ {t("recordTransaction", locale)}</Link>
          </div>
        </div>
        {holdingsWithTx.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">{t("noHoldingsYet", locale)}</p>
            <Link href="/transactions/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">{t("recordFirst", locale)}</Link>
          </div>
        ) : (
          <HoldingsTable holdings={holdingsWithTx} locale={locale} />
        )}
      </main>
    </div>
  );
}
