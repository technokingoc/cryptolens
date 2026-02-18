export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tradeProposals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { approveProposal, rejectProposal } from "@/lib/proposal-actions";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";

const pillarLabels = [
  { key: "pillarTechnical", label: "Technical", icon: "📊" },
  { key: "pillarNarrative", label: "Narrative", icon: "📰" },
  { key: "pillarSentiment", label: "Sentiment", icon: "🐦" },
  { key: "pillarOnchain", label: "On-Chain", icon: "🔗" },
  { key: "pillarMacro", label: "Macro", icon: "🏦" },
  { key: "pillarFundamentals", label: "Fundamentals", icon: "💰" },
  { key: "pillarRiskreward", label: "Risk/Reward", icon: "⚖️" },
] as const;

function scoreColor(s: number) {
  if (s >= 2) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (s >= 1) return "text-emerald-600 bg-emerald-50/50 border-emerald-100";
  if (s === 0) return "text-gray-500 bg-gray-50 border-gray-200";
  if (s >= -1) return "text-red-500 bg-red-50/50 border-red-100";
  return "text-red-600 bg-red-50 border-red-200";
}

function signalBadge(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("STRONG BUY")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("MODERATE BUY")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
  if (s.includes("NEUTRAL")) return "bg-gray-50 text-gray-600 border-gray-200";
  if (s.includes("SELL")) return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-50 text-gray-500 border-gray-200";
}

function statusBadge(status: string) {
  switch (status) {
    case "pending": return "bg-amber-50 text-amber-600";
    case "approved": return "bg-emerald-50 text-emerald-600";
    case "rejected": return "bg-red-50 text-red-500";
    case "executed": return "bg-gray-100 text-gray-600";
    case "expired": return "bg-gray-50 text-gray-400";
    default: return "bg-gray-50 text-gray-400";
  }
}

export default async function ProposalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const proposals = await db.select().from(tradeProposals).where(eq(tradeProposals.userId, session.user.id)).orderBy(desc(tradeProposals.createdAt));
  const pending = proposals.filter((p) => p.status === "pending");
  const history = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">⚡ {t("tradeProposals", locale)}</h1>
            <p className="text-gray-400 text-sm">{t("reviewAndDecideDesc", locale)}</p>
          </div>
          <LanguageSwitcher locale={locale} />
        </div>

        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-amber-600 mb-4">🔔 {t("pending", locale)} ({pending.length})</h2>
            <div className="space-y-5">
              {pending.map((p) => (
                <ProposalCard key={p.id} proposal={p} showActions={true} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center mb-8">
            <p className="text-gray-400 text-lg mb-1">{t("noProposals", locale)}</p>
            <p className="text-gray-300 text-sm">{t("submitsWhen", locale)}</p>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-4">📋 {t("history", locale)}</h2>
            <div className="space-y-4">
              {history.map((p) => (
                <ProposalCard key={p.id} proposal={p} showActions={false} locale={locale} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProposalCard({ proposal: p, showActions, locale }: { proposal: Record<string, unknown> & { id: string; symbol: string; signal: string; status: string; confluenceScore: string; action: string; bucket: string; timeHorizon?: string | null; riskReward?: string | null; thesis?: string | null; entryPrice?: string | null; stopLoss?: string | null; target1?: string | null; target2?: string | null; maxLoss?: string | null; expectedGain?: string | null; positionSizePct?: string | null; risks?: string[] | null; founderDecision?: string | null; decisionNotes?: string | null; createdAt?: Date | null; pillarNotes?: unknown; [key: string]: unknown }; showActions: boolean; locale: Locale }) {
  const notes = (p.pillarNotes as Record<string, string>) ?? {};

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap"><span className="text-xl font-bold text-gray-900">{p.symbol}</span><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${signalBadge(p.signal)}`}>{p.signal}</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(p.status)}`}>{p.status.toUpperCase()}</span></div>
        <div className="text-right"><p className="text-2xl font-bold text-gray-900">{parseFloat(p.confluenceScore) >= 0 ? "+" : ""}{parseFloat(p.confluenceScore).toFixed(2)}</p><p className="text-[11px] text-gray-400">{t("confluence", locale)}</p></div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip label={t("action", locale)} value={p.action} className={p.action === "BUY" ? "text-emerald-600" : "text-red-500"} />
          <Chip label={t("bucket", locale)} value={p.bucket} />
          {p.timeHorizon && <Chip label={t("horizon", locale)} value={p.timeHorizon} />}
          {p.riskReward && <Chip label="R:R" value={p.riskReward} />}
        </div>

        {p.thesis && <div className="mb-4"><p className="text-xs text-gray-400 mb-1 font-medium">💡 {t("thesis", locale)}</p><p className="text-gray-600 text-sm leading-relaxed">{p.thesis}</p></div>}

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">📊 {t("confluenceBreakdown", locale)}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {pillarLabels.map(({ key, label, icon }) => {
              const rawScore = p[key];
              const score = typeof rawScore === "number" ? rawScore : 0;
              const note = notes[key] || notes[label.toLowerCase()] || "";
              return (
                <div key={key} className={`rounded-lg p-2.5 text-center border ${scoreColor(score)}`} title={note}>
                  <p className="text-xs mb-0.5">{icon}</p>
                  <p className="text-lg font-bold">{score > 0 ? "+" : ""}{score}</p>
                  <p className="text-[10px] opacity-75">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {(p.entryPrice || p.stopLoss || p.target1) && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">📐 {t("executionPlan", locale)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {p.entryPrice && <PlanItem label={t("executionEntry", locale)} value={`$${parseFloat(p.entryPrice).toLocaleString()}`} />}
              {p.stopLoss && <PlanItem label={t("executionStopLoss", locale)} value={`$${parseFloat(p.stopLoss).toLocaleString()}`} className="text-red-500" />}
              {p.target1 && <PlanItem label={t("executionTarget1", locale)} value={`$${parseFloat(p.target1).toLocaleString()}`} className="text-emerald-600" />}
              {p.target2 && <PlanItem label={t("executionTarget2", locale)} value={`$${parseFloat(p.target2).toLocaleString()}`} className="text-emerald-600" />}
              {p.maxLoss && <PlanItem label={t("executionMaxLoss", locale)} value={`$${parseFloat(p.maxLoss).toFixed(2)}`} className="text-red-500" />}
              {p.expectedGain && <PlanItem label={t("executionExpGain", locale)} value={`$${parseFloat(p.expectedGain).toFixed(2)}`} className="text-emerald-600" />}
              {p.positionSizePct && <PlanItem label={t("executionPosition", locale)} value={`${parseFloat(p.positionSizePct).toFixed(1)}%`} />}
            </div>
          </div>
        )}

        {Array.isArray(p.risks) && p.risks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">⚠️ {t("risks", locale)}</p>
            <ul className="space-y-1">
              {p.risks.map((r: string, i: number) => (
                <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.founderDecision && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 mb-0.5">{t("founderDecision", locale)}</p>
            <p className="text-gray-900 font-medium text-sm">{p.founderDecision}</p>
            {p.decisionNotes && <p className="text-xs text-gray-500 mt-1">{p.decisionNotes}</p>}
          </div>
        )}

        {showActions && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <form action={approveProposal}>
              <input type="hidden" name="proposalId" value={p.id} />
              <button type="submit" className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition">✅ {t("approve", locale)}</button>
            </form>
            <form action={rejectProposal}>
              <input type="hidden" name="proposalId" value={p.id} />
              <button type="submit" className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition">❌ {t("reject", locale)}</button>
            </form>
          </div>
        )}
        <p className="text-[11px] text-gray-300 mt-3">{p.createdAt?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function Chip({ label, value, className = "text-gray-700" }: { label: string; value: string; className?: string }) { return <div className="bg-gray-50 rounded-lg px-3 py-1.5"><p className="text-[10px] text-gray-400">{label}</p><p className={`font-medium text-sm ${className}`}>{value}</p></div>; }
function PlanItem({ label, value, className = "text-gray-900" }: { label: string; value: string; className?: string }) { return <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">{label}</p><p className={`font-semibold text-sm ${className}`}>{value}</p></div>; }
