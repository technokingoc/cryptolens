export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { costItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { addCostItem, getTotalMonthlyCosts } from "@/lib/actions";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { Receipt, Plus, TrendingUp, Tag, Fuel, CreditCard, Repeat, BarChart3 } from "lucide-react";

const CATEGORY_META: Record<string, { icon: typeof Receipt; color: string; bg: string }> = {
  "exchange-fees": { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
  "subscriptions": { icon: Repeat, color: "text-purple-600", bg: "bg-purple-50" },
  "gas": { icon: Fuel, color: "text-orange-600", bg: "bg-orange-50" },
  "other": { icon: Tag, color: "text-gray-600", bg: "bg-gray-100" },
};

function getCategoryKey(cat: string | null): string {
  if (!cat) return "other";
  const lower = cat.toLowerCase();
  if (lower.includes("exchange") || lower.includes("fee") || lower.includes("trading")) return "exchange-fees";
  if (lower.includes("sub") || lower.includes("service") || lower.includes("tool")) return "subscriptions";
  if (lower.includes("gas") || lower.includes("network") || lower.includes("tx")) return "gas";
  return "other";
}

const catLabels: Record<string, Record<string, string>> = {
  "exchange-fees": { en: "Exchange Fees", pt: "Taxas de Exchange" },
  subscriptions: { en: "Subscriptions", pt: "Assinaturas" },
  gas: { en: "Gas / Network", pt: "Gas / Rede" },
  other: { en: "Other", pt: "Outros" },
};

export default async function CostsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const items = await db.select().from(costItems).where(eq(costItems.userId, session.user.id)).orderBy(desc(costItems.createdAt));
  const monthlyCost = await getTotalMonthlyCosts(session.user.id);
  const inputCls = "bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200";

  // Category breakdown
  const byCategory: Record<string, number> = {};
  items.filter(i => i.isActive).forEach(item => {
    const key = getCategoryKey(item.category);
    const amt = parseFloat(item.amount);
    const monthly = item.frequency === "monthly" ? amt : item.frequency === "annual" ? amt / 12 : 0;
    byCategory[key] = (byCategory[key] ?? 0) + monthly;
  });

  const totalMonthly = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Costs" }]} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2"><Receipt className="w-6 h-6 text-gray-400" /> {t("operatingCosts", locale)}</h1>
            <p className="text-gray-500 text-sm">{t("monthlyBurn", locale)}: <span className="text-gray-900 font-semibold">${monthlyCost.toFixed(2)}/mo</span></p>
          </div>
        </div>

        {/* Category Breakdown Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Object.entries(catLabels).map(([key, label]) => {
            const meta = CATEGORY_META[key];
            const Icon = meta.icon;
            const val = byCategory[key] ?? 0;
            const pct = totalMonthly > 0 ? ((val / totalMonthly) * 100).toFixed(0) : "0";
            return (
              <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${meta.bg} p-1.5 rounded-lg`}><Icon className={`w-4 h-4 ${meta.color}`} /></div>
                  <span className="text-xs text-gray-500">{label[locale]}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">${val.toFixed(2)}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${meta.bg.replace("50", "400").replace("bg-gray-100", "bg-gray-400")}`} style={{ width: `${pct}%`, backgroundColor: key === "exchange-fees" ? "#3b82f6" : key === "subscriptions" ? "#9333ea" : key === "gas" ? "#ea580c" : "#6b7280" }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{pct}% {locale === "pt" ? "do total" : "of total"}</p>
              </div>
            );
          })}
        </div>

        {/* Monthly Trend Placeholder */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5 mb-3"><BarChart3 className="w-4 h-4" /> {locale === "pt" ? "Tendência Mensal" : "Monthly Trend"}</h2>
          <div className="h-32 flex items-end justify-between gap-1 px-2">
            {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m, i) => {
              const heights = [40, 55, 48, 62, 70, monthlyCost > 0 ? 80 : 30];
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-blue-100 rounded-t" style={{ height: `${heights[i]}%` }}>
                    <div className="w-full h-full bg-blue-500 rounded-t opacity-20 hover:opacity-40 transition" />
                  </div>
                  <span className="text-[10px] text-gray-400">{m}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">{locale === "pt" ? "Dados ilustrativos — histórico real em breve" : "Illustrative data — real history coming soon"}</p>
        </div>

        {/* Add Cost Form */}
        <form action={addCostItem} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-1.5"><Plus className="w-4 h-4" /> {t("addCostItem", locale)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="name" required placeholder={t("name", locale)} className={inputCls} />
            <input name="amount" type="number" step="0.01" required placeholder={t("amount", locale)} className={inputCls} />
            <select name="frequency" required className={inputCls}>
              <option value="monthly">{t("monthly", locale)}</option>
              <option value="annual">{t("annual", locale)}</option>
              <option value="one-time">{t("oneTime", locale)}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select name="category" className={inputCls}>
              <option value="">{locale === "pt" ? "Selecionar categoria..." : "Select category..."}</option>
              <option value="exchange-fees">{catLabels["exchange-fees"][locale]}</option>
              <option value="subscriptions">{catLabels["subscriptions"][locale]}</option>
              <option value="gas">{catLabels["gas"][locale]}</option>
              <option value="other">{catLabels["other"][locale]}</option>
            </select>
            <input name="startDate" type="date" required className={inputCls} />
            <input name="description" placeholder={t("description", locale)} className={inputCls} />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t("addCost", locale)}
          </button>
        </form>

        {/* Cost Items Table */}
        {items.length > 0 && (
          <>
            <div className="sm:hidden space-y-3">
              {items.map((c) => {
                const catKey = getCategoryKey(c.category);
                const meta = CATEGORY_META[catKey];
                const CatIcon = meta.icon;
                return (
                  <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`${meta.bg} p-1 rounded`}><CatIcon className={`w-3.5 h-3.5 ${meta.color}`} /></div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{c.isActive ? t("active", locale) : t("ended", locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{c.frequency}</span>
                      <span className="text-gray-900 font-medium">${parseFloat(c.amount).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("name", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("category", locale)}</th>
                  <th className="text-right px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("amount", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("frequency", locale)}</th>
                  <th className="text-left px-4 py-3 text-[11px] text-gray-400 uppercase tracking-wide">{t("status", locale)}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c) => {
                    const catKey = getCategoryKey(c.category);
                    const meta = CATEGORY_META[catKey];
                    const CatIcon = meta.icon;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CatIcon className={`w-3.5 h-3.5 ${meta.color}`} />
                            <span className="text-gray-500">{catLabels[catKey][locale]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">${parseFloat(c.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500">{c.frequency}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{c.isActive ? t("active", locale) : t("ended", locale)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
