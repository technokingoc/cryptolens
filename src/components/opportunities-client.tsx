"use client";

import { useState, useMemo } from "react";
import { Filter, X, Eye, Search, ShieldCheck, Brain, Lightbulb, SlidersHorizontal } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type Opp = {
  id: string;
  protocolName: string;
  symbol: string | null;
  status: string;
  riskScore: number;
  riskFlags: string[] | null;
  category: string | null;
  chain: string | null;
  source: string | null;
  ageDays: number | null;
  tvl: string | null;
  tvlChange1d: string | null;
  tvlChange7d: string | null;
  price: string | null;
  mcap: string | null;
  volume24h: string | null;
  wenVerdict: string | null;
  thesis: string | null;
  opportunityScore: number;
  createdAt: string | null;
};

type SortOption = "newest" | "oldest" | "riskLow" | "riskHigh" | "score";

function riskBadge(score: number, locale: Locale) {
  if (score <= 20) return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: locale === "pt" ? "Risco Baixo" : "Low Risk" };
  if (score <= 40) return { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", label: locale === "pt" ? "Moderado" : "Moderate" };
  if (score <= 60) return { bg: "bg-orange-50 text-orange-700 border-orange-200", label: locale === "pt" ? "Risco Alto" : "High Risk" };
  if (score <= 80) return { bg: "bg-red-50 text-red-600 border-red-200", label: locale === "pt" ? "Muito Alto" : "Very High" };
  return { bg: "bg-red-100 text-red-700 border-red-300", label: locale === "pt" ? "Extremo" : "Extreme" };
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

export function OpportunitiesClient({ opps, locale, watchAction, passAction }: { opps: Opp[]; locale: Locale; watchAction: (formData: FormData) => Promise<void>; passAction: (formData: FormData) => Promise<void> }) {
  const [chainFilter, setChainFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const chains = useMemo(() => [...new Set(opps.map((o) => o.chain).filter(Boolean))] as string[], [opps]);
  const sources = useMemo(() => [...new Set(opps.map((o) => o.source).filter(Boolean))] as string[], [opps]);

  const hasActiveFilters = chainFilter || sourceFilter || ageFilter;

  const filtered = useMemo(() => {
    let result = [...opps];
    if (chainFilter) result = result.filter((o) => o.chain === chainFilter);
    if (sourceFilter) result = result.filter((o) => o.source === sourceFilter);
    if (ageFilter) {
      result = result.filter((o) => {
        if (o.ageDays == null) return ageFilter === "";
        if (ageFilter === "7") return o.ageDays < 7;
        if (ageFilter === "30") return o.ageDays < 30;
        if (ageFilter === "90") return o.ageDays < 90;
        if (ageFilter === "90+") return o.ageDays >= 90;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest": return (b.createdAt || "").localeCompare(a.createdAt || "");
        case "oldest": return (a.createdAt || "").localeCompare(b.createdAt || "");
        case "riskLow": return a.riskScore - b.riskScore;
        case "riskHigh": return b.riskScore - a.riskScore;
        case "score": return b.opportunityScore - a.opportunityScore;
        default: return 0;
      }
    });

    return result;
  }, [opps, chainFilter, sourceFilter, ageFilter, sort]);

  const newOpps = filtered.filter((o) => o.status === "new" || o.status === "watching");
  const history = filtered.filter((o) => o.status === "passed" || o.status === "invested");

  const clearFilters = () => {
    setChainFilter("");
    setSourceFilter("");
    setAgeFilter("");
    setSort("newest");
  };

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition mb-3"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{showFilters ? t("clickToCollapse", locale) : "Filters & Sort"}</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
        </button>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{t("filterByChain", locale)}</label>
                <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">{t("allChains", locale)}</option>
                  {chains.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{t("filterBySource", locale)}</label>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">{t("allSources", locale)}</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{t("filterByAge", locale)}</label>
                <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="">{t("allAges", locale)}</option>
                  <option value="7">{t("under7d", locale)}</option>
                  <option value="30">{t("under30d", locale)}</option>
                  <option value="90">{t("under90d", locale)}</option>
                  <option value="90+">{t("over90d", locale)}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{t("sortBy", locale)}</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700">
                  <option value="newest">{t("sortNewest", locale)}</option>
                  <option value="oldest">{t("sortOldest", locale)}</option>
                  <option value="riskLow">{t("sortRiskLow", locale)}</option>
                  <option value="riskHigh">{t("sortRiskHigh", locale)}</option>
                  <option value="score">{t("sortScore", locale)}</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <X className="w-3 h-3" /> {t("clearFilters", locale)}
              </button>
            )}
          </div>
        )}
      </div>

      {newOpps.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{t("active", locale)} ({newOpps.length})</h2>
          <div className="space-y-4">{newOpps.map((o) => <OppCard key={o.id} opp={o} showActions locale={locale} watchAction={watchAction} passAction={passAction} />)}</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center mb-8">
          <p className="text-gray-400 text-lg mb-1">{t("noActiveOpps", locale)}</p>
          <p className="text-gray-300 text-sm">{t("scansDesc", locale)}</p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-4">{t("history", locale)}</h2>
          <div className="space-y-3">{history.map((o) => <OppCard key={o.id} opp={o} showActions={false} locale={locale} watchAction={watchAction} passAction={passAction} />)}</div>
        </div>
      )}
    </>
  );
}

function OppCard({ opp: o, showActions, locale, watchAction, passAction }: { opp: Opp; showActions: boolean; locale: Locale; watchAction: (formData: FormData) => Promise<void>; passAction: (formData: FormData) => Promise<void> }) {
  const risk = riskBadge(o.riskScore, locale);
  const flags = (o.riskFlags || []) as string[];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{o.protocolName}</span>
          {o.symbol && <span className="text-gray-400 text-sm">{o.symbol}</span>}
          <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(o.status)}`}>{o.status.toUpperCase()}</span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${risk.bg}`}>{risk.label} ({o.riskScore}/100)</span>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {o.category && <Chip label={t("category", locale)} value={o.category} />}
          {o.chain && <Chip label={t("filterByChain", locale)} value={o.chain} />}
          {o.source && <Chip label={t("filterBySource", locale)} value={o.source} />}
          {o.ageDays != null && <Chip label={t("filterByAge", locale)} value={`${o.ageDays}d`} />}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {o.tvl && <NumCard label="TVL" value={`$${(parseFloat(o.tvl) / 1e6).toFixed(2)}M`} />}
          {o.tvlChange1d && <NumCard label="TVL 1d" value={`${parseFloat(o.tvlChange1d) >= 0 ? "+" : ""}${parseFloat(o.tvlChange1d).toFixed(1)}%`} positive={parseFloat(o.tvlChange1d) >= 0} />}
          {o.tvlChange7d && <NumCard label="TVL 7d" value={`${parseFloat(o.tvlChange7d) >= 0 ? "+" : ""}${parseFloat(o.tvlChange7d).toFixed(1)}%`} positive={parseFloat(o.tvlChange7d) >= 0} />}
          {o.price && <NumCard label={t("price", locale)} value={`$${parseFloat(o.price).toFixed(6)}`} />}
          {o.mcap && <NumCard label={t("mCap", locale)} value={`$${(parseFloat(o.mcap) / 1e6).toFixed(2)}M`} />}
          {o.volume24h && <NumCard label={t("volume", locale)} value={`$${(parseFloat(o.volume24h) / 1e6).toFixed(2)}M`} />}
        </div>

        {flags.length > 0 && <div className="mb-4"><p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {t("riskAssessment", locale)}</p><div className="bg-gray-50 rounded-lg p-3 space-y-1">{flags.map((f, i) => <p key={i} className="text-sm text-gray-600">{f}</p>)}</div></div>}
        {o.wenVerdict && <div className="mb-4"><p className="text-xs text-gray-400 mb-1 font-medium flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {t("wensVerdict", locale)}</p><p className="text-gray-600 text-sm leading-relaxed">{o.wenVerdict}</p></div>}
        {o.thesis && <div className="mb-4"><p className="text-xs text-gray-400 mb-1 font-medium flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> {t("thesis", locale)}</p><p className="text-gray-600 text-sm leading-relaxed">{o.thesis}</p></div>}

        {showActions && o.status === "new" && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <form action={watchAction}><input type="hidden" name="id" value={o.id} /><button type="submit" className="bg-amber-50 text-amber-700 border border-amber-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition inline-flex items-center gap-1.5"><Eye className="w-4 h-4" /> {t("watch", locale)}</button></form>
            <form action={passAction}><input type="hidden" name="id" value={o.id} /><button type="submit" className="bg-gray-50 text-gray-500 border border-gray-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition">{t("skip", locale)}</button></form>
          </div>
        )}

        {o.createdAt && <p className="text-[11px] text-gray-300 mt-3">{new Date(o.createdAt).toLocaleString()}</p>}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) { return <div className="bg-gray-50 rounded-lg px-3 py-1.5"><p className="text-[10px] text-gray-400">{label}</p><p className="text-sm text-gray-700 font-medium">{value}</p></div>; }
function NumCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) { return <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">{label}</p><p className={`font-semibold text-sm ${positive === true ? "text-emerald-600" : positive === false ? "text-red-500" : "text-gray-900"}`}>{value}</p></div>; }
