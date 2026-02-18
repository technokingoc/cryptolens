export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { analysisReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

const typeIcon: Record<string, string> = { market_report: "🌍", trade_analysis: "⚡", portfolio_review: "💼", alert: "🚨" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const reports = await db.select().from(analysisReports).where(eq(analysisReports.userId, session.user.id)).orderBy(desc(analysisReports.createdAt));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">📄 {t("analysisReports", locale)}</h1>
            <p className="text-gray-400 text-sm">{t("reportsDesc", locale)}</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-1">{t("noReports", locale)}</p>
            <p className="text-gray-300 text-sm">{t("savesReports", locale)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <details key={r.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcon[r.reportType] || "📄"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                      <p className="text-[11px] text-gray-400">{r.reportType.replace("_", " ")} · {r.createdAt?.toLocaleString()}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 transform group-open:rotate-180 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 py-4 border-t border-gray-100"><pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans leading-relaxed">{r.content}</pre></div>
              </details>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
