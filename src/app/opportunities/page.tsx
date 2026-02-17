export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { watchOpportunity, passOpportunity } from "@/lib/opportunity-actions";

function riskBadge(score: number) {
  if (score <= 20) return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low Risk" };
  if (score <= 40) return { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "Moderate" };
  if (score <= 60) return { bg: "bg-orange-50 text-orange-700 border-orange-200", label: "High Risk" };
  if (score <= 80) return { bg: "bg-red-50 text-red-600 border-red-200", label: "Very High" };
  return { bg: "bg-red-100 text-red-700 border-red-300", label: "Extreme" };
}

function statusBadge(s: string) {
  switch (s) {
    case "new": return "bg-blue-50 text-blue-600";
    case "watching": return "bg-amber-50 text-amber-600";
    case "passed": return "bg-gray-100 text-gray-400";
    case "invested": return "bg-emerald-50 text-emerald-600";
    default: return "bg-gray-50 text-gray-400";
  }
}

export default async function OpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const opps = await db.select().from(opportunities).where(eq(opportunities.userId, session.user.id)).orderBy(desc(opportunities.createdAt));
  const newOpps = opps.filter((o) => o.status === "new" || o.status === "watching");
  const history = opps.filter((o) => o.status === "passed" || o.status === "invested");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🔎 Opportunities</h1>
        <p className="text-gray-400 text-sm mb-6">Early-stage protocols & coins detected by Wen&apos;s scanner — rug-pull risk assessed</p>

        {newOpps.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Active ({newOpps.length})</h2>
            <div className="space-y-4">
              {newOpps.map((o) => <OppCard key={o.id} opp={o} showActions />)}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center mb-8">
            <p className="text-gray-400 text-lg mb-1">No active opportunities</p>
            <p className="text-gray-300 text-sm">Wen scans DefiLlama & CoinGecko for early-stage protocols with rug-pull detection</p>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-4">History</h2>
            <div className="space-y-3">
              {history.map((o) => <OppCard key={o.id} opp={o} showActions={false} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function OppCard({ opp: o, showActions }: { opp: any; showActions: boolean }) {
  const risk = riskBadge(o.riskScore);
  const flags = (o.riskFlags || []) as string[];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{o.protocolName}</span>
          {o.symbol && <span className="text-gray-400 text-sm">{o.symbol}</span>}
          <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(o.status)}`}>{o.status.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${risk.bg}`}>{risk.label} ({o.riskScore}/100)</span>
        </div>
      </div>

      <div className="p-5">
        {/* Key Metrics */}
        <div className="flex flex-wrap gap-2 mb-4">
          {o.category && <Chip label="Category" value={o.category} />}
          {o.chain && <Chip label="Chain" value={o.chain} />}
          {o.source && <Chip label="Source" value={o.source} />}
          {o.ageDays != null && <Chip label="Age" value={`${o.ageDays}d`} />}
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {o.tvl && <NumCard label="TVL" value={`$${(parseFloat(o.tvl) / 1e6).toFixed(2)}M`} />}
          {o.tvlChange1d && <NumCard label="TVL 1d" value={`${parseFloat(o.tvlChange1d) >= 0 ? "+" : ""}${parseFloat(o.tvlChange1d).toFixed(1)}%`} positive={parseFloat(o.tvlChange1d) >= 0} />}
          {o.tvlChange7d && <NumCard label="TVL 7d" value={`${parseFloat(o.tvlChange7d) >= 0 ? "+" : ""}${parseFloat(o.tvlChange7d).toFixed(1)}%`} positive={parseFloat(o.tvlChange7d) >= 0} />}
          {o.price && <NumCard label="Price" value={`$${parseFloat(o.price).toFixed(6)}`} />}
          {o.mcap && <NumCard label="MCap" value={`$${(parseFloat(o.mcap) / 1e6).toFixed(2)}M`} />}
          {o.volume24h && <NumCard label="Volume" value={`$${(parseFloat(o.volume24h) / 1e6).toFixed(2)}M`} />}
        </div>

        {/* Risk Flags */}
        {flags.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium">🛡️ Risk Assessment</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {flags.map((f, i) => (
                <p key={i} className="text-sm text-gray-600">{f}</p>
              ))}
            </div>
          </div>
        )}

        {/* Wen's Verdict */}
        {o.wenVerdict && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1 font-medium">🧠 Wen&apos;s Verdict</p>
            <p className="text-gray-600 text-sm leading-relaxed">{o.wenVerdict}</p>
          </div>
        )}

        {/* Thesis */}
        {o.thesis && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1 font-medium">💡 Thesis</p>
            <p className="text-gray-600 text-sm leading-relaxed">{o.thesis}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && o.status === "new" && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <form action={watchOpportunity}>
              <input type="hidden" name="id" value={o.id} />
              <button type="submit" className="bg-amber-50 text-amber-700 border border-amber-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition">👀 Watch</button>
            </form>
            <form action={passOpportunity}>
              <input type="hidden" name="id" value={o.id} />
              <button type="submit" className="bg-gray-50 text-gray-500 border border-gray-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition">Skip</button>
            </form>
          </div>
        )}

        <p className="text-[11px] text-gray-300 mt-3">{o.createdAt?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-1.5">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 font-medium">{value}</p>
    </div>
  );
}

function NumCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`font-semibold text-sm ${positive === true ? "text-emerald-600" : positive === false ? "text-red-500" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
