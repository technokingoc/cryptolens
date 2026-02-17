export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { marketCache, marketIndicators } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";

async function fetchFearGreed() {
  try { const r = await fetch("https://api.alternative.me/fng/?limit=7", { next: { revalidate: 300 } }); return await r.json(); } catch { return null; }
}
async function fetchGlobalData() {
  try { const r = await fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 120 } }); return await r.json(); } catch { return null; }
}
async function fetchTrending() {
  try { const r = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 300 } }); return await r.json(); } catch { return null; }
}

export default async function MarketPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [cached, indicators, fng, global, trending] = await Promise.all([
    db.select().from(marketCache).orderBy(desc(marketCache.lastUpdated)),
    db.select().from(marketIndicators),
    fetchFearGreed(), fetchGlobalData(), fetchTrending(),
  ]);

  const fngCurrent = fng?.data?.[0];
  const fngHistory = fng?.data ?? [];
  const gd = global?.data;

  const fngColor = (v: number) => v <= 20 ? "text-red-500" : v <= 40 ? "text-orange-500" : v <= 60 ? "text-yellow-600" : v <= 80 ? "text-emerald-600" : "text-emerald-500";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🌍 Market Intelligence</h1>

        {gd && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MC label="Total Market Cap" value={`$${(gd.total_market_cap?.usd / 1e12).toFixed(2)}T`} />
            <MC label="24h Volume" value={`$${(gd.total_volume?.usd / 1e9).toFixed(0)}B`} />
            <MC label="BTC Dominance" value={`${gd.market_cap_percentage?.btc?.toFixed(1)}%`} />
            <MC label="ETH Dominance" value={`${gd.market_cap_percentage?.eth?.toFixed(1)}%`} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Fear & Greed */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm">😱 Fear & Greed Index</h2>
            {fngCurrent ? (
              <>
                <div className="text-center mb-4">
                  <p className={`text-5xl font-bold ${fngColor(parseInt(fngCurrent.value))}`}>{fngCurrent.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{fngCurrent.value_classification}</p>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400" style={{ width: `${fngCurrent.value}%` }} />
                </div>
                <p className="text-xs text-gray-400 mb-1">7-day trend:</p>
                <div className="flex gap-1">
                  {fngHistory.slice(0, 7).reverse().map((d: any, i: number) => (
                    <div key={i} className="flex-1 text-center">
                      <div className={`text-xs font-bold ${fngColor(parseInt(d.value))}`}>{d.value}</div>
                    </div>
                  ))}
                </div>
                {parseInt(fngCurrent.value) <= 20 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-xs">🔴 Extreme Fear — Historically a contrarian buy zone</p>
                  </div>
                )}
              </>
            ) : <p className="text-gray-400 text-sm">Unable to load</p>}
          </div>

          {/* Indicators */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm">📡 Wen&apos;s Indicators</h2>
            {indicators.length === 0 ? (
              <p className="text-gray-400 text-sm">Wen will populate during analysis.</p>
            ) : (
              <div className="space-y-3">
                {indicators.map((ind) => (
                  <div key={ind.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{ind.indicatorName}</p>
                      {ind.source && <p className="text-[11px] text-gray-400">{ind.source}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{parseFloat(ind.value).toLocaleString()}</p>
                      {ind.signal && <p className="text-[11px] text-gray-500">{ind.signal}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm">🔥 Trending</h2>
            {trending?.coins ? (
              <div className="space-y-2">
                {trending.coins.slice(0, 8).map((c: any) => (
                  <div key={c.item.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      {c.item.thumb && <img src={c.item.thumb} alt="" className="w-5 h-5 rounded-full" />}
                      <span className="text-sm text-gray-700">{c.item.name}</span>
                      <span className="text-xs text-gray-400">{c.item.symbol}</span>
                    </div>
                    <span className="text-xs text-gray-400">#{c.item.market_cap_rank ?? "?"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">Unable to load</p>}
          </div>
        </div>

        {/* Price Cache */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">💹 Price Cache</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Updated by Wen during analysis</p>
          </div>
          {cached.length === 0 ? (
            <p className="p-5 text-gray-400 text-sm">No cached prices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">Coin</th>
                    <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">Price</th>
                    <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">24h</th>
                    <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden sm:table-cell">MCap</th>
                    <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden md:table-cell">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cached.map((c) => {
                    const change = c.priceChange24h ? parseFloat(c.priceChange24h) : 0;
                    return (
                      <tr key={c.coinId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.coinId} <span className="text-gray-400 text-xs">({c.symbol})</span></td>
                        <td className="px-4 py-3 text-right text-gray-700">${parseFloat(c.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-3 text-right font-medium ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{c.marketCap ? `$${(parseFloat(c.marketCap) / 1e9).toFixed(1)}B` : "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">{c.volume24h ? `$${(parseFloat(c.volume24h) / 1e6).toFixed(0)}M` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MC({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
