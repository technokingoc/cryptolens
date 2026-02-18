export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import Link from "next/link";
import { NewTransactionForm } from "@/components/new-transaction-form";
import { recordTransaction } from "@/lib/actions";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Transactions", href: "/transactions" }, { label: "New" }]} />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/holdings" className="text-gray-400 hover:text-gray-600 text-sm">← {t("back", locale)}</Link>
            <h1 className="text-2xl font-bold text-gray-900">{t("recordTx", locale)}</h1>
          </div>
        </div>
        <NewTransactionForm locale={locale} action={recordTransaction} />
      </main>
    </div>
  );
}
