export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { analysisReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";

const typeIcon: Record<string, string> = {
  market_report: "🌍",
  trade_analysis: "⚡",
  portfolio_review: "💼",
  alert: "🚨",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const reports = await db.select().from(analysisReports).where(eq(analysisReports.userId, session.user.id)).orderBy(desc(analysisReports.createdAt));

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-2">📄 Analysis Reports</h1>
        <p className="text-gray-500 text-sm mb-6">Market reports and analysis from Wen</p>

        {reports.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No reports yet</p>
            <p className="text-gray-600 text-sm">Wen will save reports here during analysis cycles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <details key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
                <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/30 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcon[r.reportType] || "📄"}</span>
                    <div>
                      <p className="font-semibold text-white">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.reportType.replace("_", " ")} · {r.createdAt?.toLocaleString()}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 transform group-open:rotate-180 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 py-4 border-t border-gray-800">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{r.content}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
