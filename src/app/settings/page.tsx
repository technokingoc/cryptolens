export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { Settings, User, Bell, Monitor, BarChart3, Database } from "lucide-react";
import { DisplayDensityToggle } from "@/components/display-density-toggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-3xl">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">{t("settings", locale)}</h1>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <Section icon={<User className="w-4 h-4" />} title={t("profileSection", locale)}>
            <Row label={t("user", locale)} value={session.user?.email ?? "—"} />
            <Row label={t("name", locale)} value={session.user?.name ?? "—"} />
          </Section>

          {/* Trading Parameters */}
          <Section icon={<BarChart3 className="w-4 h-4" />} title={t("tradingParameters", locale)}>
            <Row label={t("longTermAlloc", locale)} value="50%" />
            <Row label={t("shortTermAlloc", locale)} value="50%" />
            <Row label={t("baseCurrency", locale)} value="USD" />
          </Section>

          {/* Data & Integration */}
          <Section icon={<Database className="w-4 h-4" />} title={t("dataIntegration", locale)}>
            <Row label={t("marketDataSource", locale)} value="CoinGecko (Free API, 60s cache)" />
            <Row label={t("aiAnalyst", locale)} value="Wen — 7-pillar confluence model" />
          </Section>

          {/* Notification Preferences */}
          <Section icon={<Bell className="w-4 h-4" />} title={t("notificationPrefs", locale)}>
            <ToggleRow label={t("proposalAlerts", locale)} checked />
            <ToggleRow label={t("marketAlerts", locale)} checked={false} />
            <ToggleRow label={t("weeklyDigest", locale)} checked={false} />
            <ToggleRow label={t("emailNotifications", locale)} checked={false} />
          </Section>

          {/* Display Preferences */}
          <Section icon={<Monitor className="w-4 h-4" />} title={t("displayPrefs", locale)}>
            <Row label={t("theme", locale)} value={t("light", locale)} />
            <Row label={t("language", locale)} value={locale === "pt" ? "Português" : "English"} />
            <CustomRow label={t("density", locale)}>
              <DisplayDensityToggle locale={locale} />
            </CustomRow>
          </Section>

          <p className="text-gray-300 text-xs pt-2">{t("configSoon", locale)}</p>
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">{icon} {title}</h2>
      <div className="space-y-0 divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function ToggleRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex justify-between items-center py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <div className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-blue-600" : "bg-gray-200"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

function CustomRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 gap-3">
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </div>
  );
}
