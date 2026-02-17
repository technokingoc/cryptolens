export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tradeProposals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { approveProposal, rejectProposal } from "@/lib/proposal-actions";

const pillarLabels = [
  { key: "pillarTechnical", label: "Technical", icon: "📊" },
  { key: "pillarNarrative", label: "Narrative", icon: "📰" },
  { key: "pillarSentiment", label: "Sentiment", icon: "🐦" },
  { key: "pillarOnchain", label: "On-Chain", icon: "🔗" },
  { key: "pillarMacro", label: "Macro", icon: "🏦" },
  { key: "pillarFundamentals", label: "Fundamentals", icon: "💰" },
  { key: "pillarRiskreward", label: "Risk/Reward", icon: "⚖️" },
] as const;

function scoreColor(score: number) {
  if (score >= 2) return "text-green-400 bg-green-900/30";
  if (score >= 1) return "text-green-300 bg-green-900/20";
  if (score === 0) return "text-gray-400 bg-gray-800";
  if (score >= -1) return "text-red-300 bg-red-900/20";
  return "text-red-400 bg-red-900/30";
}

function signalBadge(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("STRONG BUY")) return "bg-green-800/50 text-green-300 border-green-700";
  if (s.includes("MODERATE BUY")) return "bg-green-900/30 text-green-400 border-green-800";
  if (s.includes("NEUTRAL")) return "bg-gray-800 text-gray-400 border-gray-700";
  if (s.includes("MODERATE SELL")) return "bg-red-900/30 text-red-400 border-red-800";
  if (s.includes("STRONG SELL")) return "bg-red-800/50 text-red-300 border-red-700";
  return "bg-gray-800 text-gray-400 border-gray-700";
}

function statusBadge(status: string) {
  switch (status) {
    case "pending": return "bg-yellow-900/30 text-yellow-400";
    case "approved": return "bg-green-900/30 text-green-400";
    case "rejected": return "bg-red-900/30 text-red-400";
    case "executed": return "bg-slate-700/50 text-slate-300";
    case "expired": return "bg-gray-800 text-gray-500";
    default: return "bg-gray-800 text-gray-400";
  }
}

export default async function ProposalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const proposals = await db.select().from(tradeProposals).where(eq(tradeProposals.userId, session.user.id)).orderBy(desc(tradeProposals.createdAt));

  const pending = proposals.filter((p) => p.status === "pending");
  const history = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-2">⚡ Trade Proposals</h1>
        <p className="text-gray-500 text-sm mb-6">Wen&apos;s confluence-scored trade recommendations. Review, approve, or reject.</p>

        {/* Pending Proposals */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4">🔔 Pending Decisions ({pending.length})</h2>
            <div className="space-y-6">
              {pending.map((p) => (
                <ProposalCard key={p.id} proposal={p} showActions />
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center mb-8">
            <p className="text-gray-500 text-lg mb-2">No pending proposals</p>
            <p className="text-gray-600 text-sm">Wen will submit proposals when confluence score meets threshold (&gt;+0.5)</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-400 mb-4">📋 History</h2>
            <div className="space-y-4">
              {history.map((p) => (
                <ProposalCard key={p.id} proposal={p} showActions={false} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProposalCard({ proposal: p, showActions }: { proposal: any; showActions: boolean }) {
  const notes = (p.pillarNotes as Record<string, string>) ?? {};

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">{p.symbol}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${signalBadge(p.signal)}`}>{p.signal}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(p.status)}`}>{p.status.toUpperCase()}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{parseFloat(p.confluenceScore) >= 0 ? "+" : ""}{parseFloat(p.confluenceScore).toFixed(2)}</p>
          <p className="text-xs text-gray-500">Confluence Score</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Action & Bucket */}
        <div className="flex gap-4 mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Action</p>
            <p className={`font-bold ${p.action === "BUY" ? "text-green-400" : p.action === "SELL" ? "text-red-400" : "text-gray-300"}`}>{p.action}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">Bucket</p>
            <p className="text-white font-medium">{p.bucket}</p>
          </div>
          {p.timeHorizon && (
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-500">Horizon</p>
              <p className="text-white font-medium">{p.timeHorizon}</p>
            </div>
          )}
          {p.riskReward && (
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-500">Risk:Reward</p>
              <p className="text-white font-medium">{p.riskReward}</p>
            </div>
          )}
        </div>

        {/* Thesis */}
        {p.thesis && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1 font-medium">💡 Thesis</p>
            <p className="text-gray-300 text-sm leading-relaxed">{p.thesis}</p>
          </div>
        )}

        {/* 7 Pillars */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2 font-medium">📊 Confluence Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {pillarLabels.map(({ key, label, icon }) => {
              const score = p[key] ?? 0;
              const note = notes[key] || notes[label.toLowerCase()] || "";
              return (
                <div key={key} className={`rounded-lg p-3 text-center ${scoreColor(score)}`} title={note}>
                  <p className="text-xs mb-1">{icon}</p>
                  <p className="text-lg font-bold">{score > 0 ? "+" : ""}{score}</p>
                  <p className="text-xs opacity-75">{label}</p>
                  {note && <p className="text-xs mt-1 opacity-60 truncate">{note}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Plan */}
        {(p.entryPrice || p.stopLoss || p.target1) && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2 font-medium">📐 Execution Plan</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.entryPrice && <PlanItem label="Entry" value={`$${parseFloat(p.entryPrice).toLocaleString()}`} />}
              {p.stopLoss && <PlanItem label="Stop-Loss" value={`$${parseFloat(p.stopLoss).toLocaleString()}`} className="text-red-400" />}
              {p.target1 && <PlanItem label="Target 1" value={`$${parseFloat(p.target1).toLocaleString()}`} className="text-green-400" />}
              {p.target2 && <PlanItem label="Target 2" value={`$${parseFloat(p.target2).toLocaleString()}`} className="text-green-400" />}
              {p.maxLoss && <PlanItem label="Max Loss" value={`$${parseFloat(p.maxLoss).toFixed(2)}`} className="text-red-400" />}
              {p.expectedGain && <PlanItem label="Expected Gain" value={`$${parseFloat(p.expectedGain).toFixed(2)}`} className="text-green-400" />}
              {p.positionSizePct && <PlanItem label="Position Size" value={`${parseFloat(p.positionSizePct).toFixed(1)}%`} />}
            </div>
          </div>
        )}

        {/* Risks */}
        {p.risks && p.risks.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2 font-medium">⚠️ Risks</p>
            <ul className="space-y-1">
              {p.risks.map((r: string, i: number) => (
                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision (for history) */}
        {p.founderDecision && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Founder Decision</p>
            <p className="text-white font-medium">{p.founderDecision}</p>
            {p.decisionNotes && <p className="text-sm text-gray-400 mt-1">{p.decisionNotes}</p>}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <form action={approveProposal}>
              <input type="hidden" name="proposalId" value={p.id} />
              <button type="submit" className="bg-green-800/50 text-green-300 border border-green-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800/80 transition">
                ✅ Approve
              </button>
            </form>
            <form action={rejectProposal}>
              <input type="hidden" name="proposalId" value={p.id} />
              <button type="submit" className="bg-red-900/30 text-red-400 border border-red-800 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900/50 transition">
                ❌ Reject
              </button>
            </form>
          </div>
        )}

        <p className="text-xs text-gray-600 mt-3">{p.createdAt?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function PlanItem({ label, value, className = "text-white" }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-semibold text-sm ${className}`}>{value}</p>
    </div>
  );
}
