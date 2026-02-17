"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface ProposalFilterProps {
  locale: Locale;
  children: React.ReactNode;
  proposals: Array<{ id: string; status: string; action: string; symbol: string }>;
  renderProposal: (id: string) => React.ReactNode;
}

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;
const ACTION_FILTERS = ["all", "BUY", "SELL"] as const;

export function ProposalFilter({ locale, proposals, renderProposal }: ProposalFilterProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filtered = proposals.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (actionFilter !== "all" && p.action !== actionFilter) return false;
    return true;
  });

  const statusLabels: Record<string, string> = {
    all: t("all", locale),
    pending: t("pending", locale),
    approved: t("approved", locale),
    rejected: t("rejected", locale),
  };

  const actionLabels: Record<string, string> = {
    all: t("all", locale),
    BUY: t("buy", locale),
    SELL: t("sell", locale),
  };

  const countByStatus = (s: string) => s === "all" ? proposals.length : proposals.filter((p) => p.status === s).length;
  const countByAction = (a: string) => a === "all" ? proposals.length : proposals.filter((p) => p.action === a).length;

  return (
    <div>
      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {statusLabels[s]} ({countByStatus(s)})
          </button>
        ))}
      </div>

      {/* Action filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ACTION_FILTERS.map((a) => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              actionFilter === a
                ? a === "BUY" ? "bg-emerald-600 text-white" : a === "SELL" ? "bg-red-500 text-white" : "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {actionLabels[a]} ({countByAction(a)})
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400">{t("noProposals", locale)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div key={p.id}>{renderProposal(p.id)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
