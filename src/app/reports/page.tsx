export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { analysisReports, holdings, transactions, marketCache, portfolioSnapshots } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { FileText, Globe, Zap, Briefcase, AlertCircle, TrendingUp, TrendingDown, BarChart3, Trophy, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const typeIcon: Record<string, LucideIcon> = { market_report: Globe, trade_analysis: Zap, portfolio_review: Briefcase, alert: AlertCircle };

const labels = {
  portfolioPerformance: { en: "Portfolio Performance", pt: "Desempenho do Portfólio" },
  totalValue: { en: "Total Value", pt: "Valor Total" },
  totalCostBasis: { en: "Cost Basis", pt: "Custo Base" },
  unrealizedPnl: { en: "Unrealized P&L", pt: "L&P Não Realizado" },
  realizedPnl: { en: "Realized P&L", pt: "L&P Realizado" },
  totalReturn: { en: "Total Return", pt: "Retorno Total" },
  monthlyPnl: { en: "Monthly P&L", pt: "L&P Mensal" },
  month: { en: "Month", pt: "Mês" },
  buys: { en: "Buys", pt: "Compras" },
  sells: { en: "Sells", pt: "Vendas" },
  realized: { en: "Realized", pt: "Realizado" },
  topPerformers: { en: "Top Performers", pt: "Melhores Desempenhos" },
  worstPerformers: { en: "Worst Performers", pt: "Piores Desempenhos" },
  noData: { en: "No data available yet", pt: "Sem dados disponíveis ainda" },
  pnlPct: { en: "P&L %", pt: "L&P %" },
  asset: { en: "Asset", pt: "Ativo" },
  wenReports: { en: "Wen Reports", pt: "Relatórios do Wen" },
};

function l(key: keyof typeof labels, locale: Locale) { return labels[key][locale]; }

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const [reports, userHoldings, prices, txs] = await Promise.all([
    db.select().from(analysisReports).where(eq(analysisReports.userId, session.user.id)).orderBy(desc(analysisReports.createdAt)),
    db.select().from(holdings).where(and(eq(holdings.userId, session.user.id), eq(holdings.isActive, true))),
    db.select().from(marketCache),
    db.select().from(transactions).where(eq(transactions.userId, session.user.id)).orderBy(desc(transactions.tradedAt)),
  ]);

  const priceMap = Object.fromEntries(prices.map(p => [p.coinId, parseFloat(p.priceUsd)]));

  // Portfolio performance
  let totalValue = 0, totalCost = 0, totalUnrealized = 0;
  const holdingPerf: { symbol: string; name: string; pnlPct: number; pnl: number; value: number }[] = [];

  userHoldings.forEach(h => {
    const qty = parseFloat(h.quantity);
    const cost = parseFloat(h.costBasis);
    const currentPrice = priceMap[h.coinId] ?? 0;
    const val = qty * currentPrice;
    const pnl = val - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    totalValue += val;
    totalCost += cost;
    totalUnrealized += pnl;
    if (qty > 0) holdingPerf.push({ symbol: h.symbol, name: h.name, pnlPct, pnl, value: val });
  });

  const totalReturnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(1) : "0.0";

  // Realized PnL from sells
  const totalRealized = txs.filter(tx => tx.type === "SELL" && tx.realizedPnl).reduce((sum, tx) => sum + parseFloat(tx.realizedPnl!), 0);

  // Top & worst performers
  const sorted = [...holdingPerf].sort((a, b) => b.pnlPct - a.pnlPct);
  const top = sorted.slice(0, 5);
  const worst = [...sorted].reverse().slice(0, 5);

  // Monthly PnL from transactions
  const monthlyData: Record<string, { buys: number; sells: number; realized: number }> = {};
  txs.forEach(tx => {
    const d = tx.tradedAt ?? tx.createdAt;
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) monthlyData[key] = { buys: 0, sells: 0, realized: 0 };
    const val = parseFloat(tx.totalValue);
    if (tx.type === "BUY") monthlyData[key].buys += val;
    else {
      monthlyData[key].sells += val;
      monthlyData[key].realized += parseFloat(tx.realizedPnl ?? "0");
    }
  });
  const months = Object.keys(monthlyData).sort().reverse().slice(0, 6);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2"><FileText className="w-6 h-6 text-gray-400" /> {t("analysisReports", locale)}</h1>
            <p className="text-gray-400 text-sm">{t("reportsDesc", locale)}</p>
          </div>
        </div>

        {/* Portfolio Performance Summary Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5 mb-4"><BarChart3 className="w-4 h-4" /> {l("portfolioPerformance", locale)}</h2>
          {userHoldings.length === 0 ? (
            <p className="text-gray-400 text-sm">{l("noData", locale)}</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l("totalValue", locale)}</p>
                <p className="text-lg font-bold text-gray-900">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l("totalCostBasis", locale)}</p>
                <p className="text-lg font-bold text-gray-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l("unrealizedPnl", locale)}</p>
                <p className={`text-lg font-bold ${totalUnrealized >= 0 ? "text-emerald-600" : "text-red-500"}`}>{totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l("realizedPnl", locale)}</p>
                <p className={`text-lg font-bold ${totalRealized >= 0 ? "text-emerald-600" : "text-red-500"}`}>{totalRealized >= 0 ? "+" : ""}${totalRealized.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l("totalReturn", locale)}</p>
                <p className={`text-lg font-bold ${parseFloat(totalReturnPct) >= 0 ? "text-emerald-600" : "text-red-500"}`}>{parseFloat(totalReturnPct) >= 0 ? "+" : ""}{totalReturnPct}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Top & Worst Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5 mb-3"><Trophy className="w-4 h-4 text-amber-500" /> {l("topPerformers", locale)}</h2>
            {top.length === 0 ? <p className="text-gray-400 text-sm">{l("noData", locale)}</p> : (
              <div className="space-y-2">
                {top.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-4">{i + 1}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{h.symbol}</span>
                        <span className="text-xs text-gray-400 ml-1">{h.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${h.pnlPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%</span>
                      <p className="text-[10px] text-gray-400">{h.pnl >= 0 ? "+" : ""}${h.pnl.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5 mb-3"><ArrowDown className="w-4 h-4 text-red-500" /> {l("worstPerformers", locale)}</h2>
            {worst.length === 0 ? <p className="text-gray-400 text-sm">{l("noData", locale)}</p> : (
              <div className="space-y-2">
                {worst.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-4">{i + 1}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{h.symbol}</span>
                        <span className="text-xs text-gray-400 ml-1">{h.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${h.pnlPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%</span>
                      <p className="text-[10px] text-gray-400">{h.pnl >= 0 ? "+" : ""}${h.pnl.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly PnL Table */}
        {months.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> {l("monthlyPnl", locale)}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{l("month", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{l("buys", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{l("sells", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{l("realized", locale)}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {months.map(m => {
                    const d = monthlyData[m];
                    return (
                      <tr key={m} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{m}</td>
                        <td className="px-4 py-3 text-right text-gray-700">${d.buys.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-4 py-3 text-right text-gray-700">${d.sells.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className={`px-4 py-3 text-right font-medium ${d.realized >= 0 ? "text-emerald-600" : "text-red-500"}`}>{d.realized >= 0 ? "+" : ""}${d.realized.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wen Reports */}
        <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> {l("wenReports", locale)}</h2>
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
                    {(() => { const Icon = typeIcon[r.reportType] || FileText; return <Icon className="w-5 h-5 text-gray-400" />; })()}
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
