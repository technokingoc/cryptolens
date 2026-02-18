export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} locale={locale} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("settings", locale)}</h1>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg space-y-5">
          <Setting label={t("longTermAlloc", locale)} value="50%" />
          <Setting label={t("shortTermAlloc", locale)} value="50%" />
          <Setting label={t("baseCurrency", locale)} value="USD" />
          <Setting label={t("marketDataSource", locale)} value="CoinGecko (Free API, 60s cache)" />
          <Setting label={t("aiAnalyst", locale)} value="Wen — 7-pillar confluence model" />
          <Setting label={t("user", locale)} value={session.user?.email ?? "—"} />
          <p className="text-gray-300 text-xs pt-2">{t("configSoon", locale)}</p>
        </div>
      </main>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{label}</span><span className="text-sm text-gray-900 font-medium">{value}</span></div>;
}
