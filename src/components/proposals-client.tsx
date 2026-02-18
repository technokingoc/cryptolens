"use client";

import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { approveProposal, rejectProposal } from "@/lib/proposal-actions";
import { Zap, Bell, ClipboardList, Lightbulb, BarChart3, Ruler, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Bookmark, Trash2 } from "lucide-react";
import { OnboardingHint } from "@/components/onboarding-hint";

const pillarLabels = [
  { key: "pillarTechnical", label: "Technical", Icon: BarChart3 },
  { key: "pillarNarrative", label: "Narrative", Icon: ClipboardList },
  { key: "pillarSentiment", label: "Sentiment", Icon: Bell },
  { key: "pillarOnchain", label: "On-Chain", Icon: Zap },
  { key: "pillarMacro", label: "Macro", Icon: BarChart3 },
  { key: "pillarFundamentals", label: "Fundamentals", Icon: Lightbulb },
  { key: "pillarRiskreward", label: "Risk/Reward", Icon: Ruler },
] as const;

type Proposal = {
  id: string; symbol: string; signal: string; status: string; confluenceScore: string;
  action: string; bucket: string; timeHorizon?: string | null; riskReward?: string | null;
  thesis?: string | null; entryPrice?: string | null; stopLoss?: string | null;
  target1?: string | null; target2?: string | null; maxLoss?: string | null;
  expectedGain?: string | null; positionSizePct?: string | null; risks?: string[] | null;
  founderDecision?: string | null; decisionNotes?: string | null; createdAt?: string | null;
  pillarNotes?: unknown; [key: string]: unknown;
};

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;
const ACTION_FILTERS = ["all", "BUY", "SELL"] as const;
const PRESETS_KEY = "cryptolens-proposals-presets";

type ProposalPreset = {
  id: string;
  name: string;
  statusFilter: string;
  actionFilter: string;
  symbolFilter: string;
};

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

export function ProposalsClient({ proposals, locale }: { proposals: Proposal[]; locale: Locale }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [presets, setPresets] = useState<ProposalPreset[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ProposalPreset[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [presetName, setPresetName] = useState("");

  const persistPresets = (next: ProposalPreset[]) => {
    setPresets(next);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  };

  const symbols = useMemo(() => [...new Set(proposals.map((p) => p.symbol))].sort(), [proposals]);

  const filtered = useMemo(() => proposals.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (actionFilter !== "all" && p.action !== actionFilter) return false;
    if (symbolFilter !== "all" && p.symbol !== symbolFilter) return false;
    return true;
  }), [proposals, statusFilter, actionFilter, symbolFilter]);

  const statusLabels: Record<string, string> = {
    all: t("all", locale), pending: t("pending", locale),
    approved: t("approved", locale), rejected: t("rejected", locale),
  };
  const actionLabels: Record<string, string> = {
    all: t("all", locale), BUY: t("buy", locale), SELL: t("sell", locale),
  };

  const countByStatus = (s: string) => s === "all" ? proposals.length : proposals.filter((p) => p.status === s).length;
  const countByAction = (a: string) => a === "all" ? proposals.length : proposals.filter((p) => p.action === a).length;

  const savePreset = () => {
    if (!presetName.trim()) return;
    const next: ProposalPreset[] = [
      {
        id: `${Date.now()}`,
        name: presetName.trim(),
        statusFilter,
        actionFilter,
        symbolFilter,
      },
      ...presets,
    ].slice(0, 8);
    persistPresets(next);
    setPresetName("");
  };

  const applyPreset = (preset: ProposalPreset) => {
    setStatusFilter(preset.statusFilter);
    setActionFilter(preset.actionFilter);
    setSymbolFilter(preset.symbolFilter);
  };

  const removePreset = (id: string) => {
    persistPresets(presets.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Zap className="w-6 h-6 text-gray-400" />
            {t("tradeProposals", locale)}
          </h1>
          <p className="text-gray-400 text-sm">{t("reviewAndDecideDesc", locale)}</p>
        </div>
      </div>

      <OnboardingHint hintKey="proposals" textKey="onboardingProposalsTip" locale={locale} />

      <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 density-card">
        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> {t("savedPresets", locale)}</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={t("presetName", locale)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={savePreset} className="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
            {t("savePreset", locale)}
          </button>
        </div>
        {presets.length === 0 ? (
          <p className="text-xs text-gray-400">{t("noPresetsYet", locale)}</p>
        ) : (
          <div className="space-y-1.5">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center justify-between rounded-lg bg-gray-50 density-card px-3 py-2">
                <div className="text-sm text-gray-700">{preset.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => applyPreset(preset)} className="text-xs text-blue-600 hover:text-blue-700">{t("applyPreset", locale)}</button>
                  <button onClick={() => removePreset(preset.id)} className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />{t("deletePreset", locale)}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-2">
        {/* Status */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {statusLabels[s]} ({countByStatus(s)})
            </button>
          ))}
        </div>
        {/* Action + Symbol */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {ACTION_FILTERS.map((a) => (
            <button key={a} onClick={() => setActionFilter(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${actionFilter === a
                ? a === "BUY" ? "bg-emerald-600 text-white" : a === "SELL" ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {actionLabels[a]} ({countByAction(a)})
            </button>
          ))}
          {symbols.length > 1 && (
            <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-200">
              <option value="all">{t("allSymbols", locale)}</option>
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-lg mb-1">{t("noFilteredProposals", locale)}</p>
          <p className="text-gray-300 text-sm">{t("submitsWhen", locale)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} locale={locale}
              expanded={expandedId === p.id}
              onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal: p, locale, expanded, onToggle }: {
  proposal: Proposal; locale: Locale; expanded: boolean; onToggle: () => void;
}) {
  const notes = (p.pillarNotes as Record<string, string>) ?? {};
  const showActions = p.status === "pending";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden density-card">
      {/* Header — always visible, clickable */}
      <button onClick={onToggle} className="w-full px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xl font-bold text-gray-900">{p.symbol}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${signalBadge(p.signal)}`}>{p.signal}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(p.status)}`}>{p.status.toUpperCase()}</span>
          <span className={`text-sm font-bold ${p.action === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{p.action}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{parseFloat(p.confluenceScore) >= 0 ? "+" : ""}{parseFloat(p.confluenceScore).toFixed(2)}</p>
            <p className="text-[11px] text-gray-400">{t("confluence", locale)}</p>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Summary chips — always visible */}
      <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
        <Chip label={t("action", locale)} value={p.action} className={p.action === "BUY" ? "text-emerald-600" : "text-red-500"} />
        <Chip label={t("bucket", locale)} value={p.bucket} />
        {p.timeHorizon && <Chip label={t("horizon", locale)} value={p.timeHorizon} />}
        {p.riskReward && <Chip label="R:R" value={p.riskReward} />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-2">
          {/* Thesis / Rationale */}
          {p.thesis && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1 font-medium flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> {t("rationale", locale)}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">{p.thesis}</p>
            </div>
          )}

          {/* Confluence Breakdown */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> {t("confluenceBreakdown", locale)}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {pillarLabels.map(({ key, label, Icon }) => {
                const rawScore = p[key];
                const score = typeof rawScore === "number" ? rawScore : 0;
                const note = notes[key] || notes[label.toLowerCase()] || "";
                return (
                  <div key={key} className={`rounded-lg p-2.5 text-center border ${scoreColor(score)}`} title={note}>
                    <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-60" />
                    <p className="text-lg font-bold">{score > 0 ? "+" : ""}{score}</p>
                    <p className="text-[10px] opacity-75">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entry / Exit */}
          {(p.entryPrice || p.stopLoss || p.target1) && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" /> {t("entryExit", locale)}
              </p>
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

          {/* Risk Notes */}
          {Array.isArray(p.risks) && p.risks.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {t("riskNotes", locale)}
              </p>
              <ul className="space-y-1">
                {p.risks.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Founder Decision */}
          {p.founderDecision && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-400 mb-0.5">{t("founderDecision", locale)}</p>
              <p className="text-gray-900 font-medium text-sm">{p.founderDecision}</p>
              {p.decisionNotes && <p className="text-xs text-gray-500 mt-1">{p.decisionNotes}</p>}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <form action={approveProposal}>
                <input type="hidden" name="proposalId" value={p.id} />
                <button type="submit" className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {t("approve", locale)}
                </button>
              </form>
              <form action={rejectProposal}>
                <input type="hidden" name="proposalId" value={p.id} />
                <button type="submit" className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> {t("reject", locale)}
                </button>
              </form>
            </div>
          )}

          <p className="text-[11px] text-gray-300 mt-3">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</p>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, className = "text-gray-700" }: { label: string; value: string; className?: string }) {
  return <div className="bg-gray-50 rounded-lg px-3 py-1.5"><p className="text-[10px] text-gray-400">{label}</p><p className={`font-medium text-sm ${className}`}>{value}</p></div>;
}
function PlanItem({ label, value, className = "text-gray-900" }: { label: string; value: string; className?: string }) {
  return <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">{label}</p><p className={`font-semibold text-sm ${className}`}>{value}</p></div>;
}
