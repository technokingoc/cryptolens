export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { marketCache, marketIndicators } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";

async function fetchFearGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=7", { next: { revalidate: 300 } });
    return await res.json();
  } catch { return null; }
}

async function fetchGlobalData() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 120 } });
    return await res.json();
  } catch { return null; }
}

async function fetchTrending() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 300 } });
    return await res.json();
  } catch { return null; }
}

export default async function MarketPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [cached, indicators, fng, global, trending] = await Promise.all([
    db.select().from(marketCache).orderBy(desc(marketCache.lastUpdated)),
    db.select().from(marketIndicators),
    fetchFearGreed(),
    fetchGlobalData(),
    fetchTrending(),
  ]);

  const fngCurrent = fng?.data?.[0];
  const fngHistory = fng?.data ?? [];
  const gd = global?.data;

  const fngColor = (v: number) => {
    if (v <= 20) return "text-red-500";
    if (v <= 40) return "text-orange-400";
    if (v <= 60) return "text-yellow-400";
    if (v <= 80) return "text-green-400";
    return "text-green-500";
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">🌍 Market Intelligence</h1>

        {/* Global Metrics */}
        {gd && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Market Cap" value={`$${(gd.total_market_cap?.usd / 1e12).toFixed(2)}T`} />
            <MetricCard label="24h Volume" value={`$${(gd.total_volume?.usd / 1e9).toFixed(0)}B`} />
            <MetricCard label="BTC Dominance" value={`${gd.market_cap_percentage?.btc?.toFixed(1)}%`} />
            <MetricCard label="ETH Dominance" value={`${gd.market_cap_percentage?.eth?.toFixed(1)}%`} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Fear & Greed */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-gray-300 mb-4">😱 Fear & Greed Index</h2>
            {fngCurrent ? (
              <>
                <div className="text-center mb-4">
                  <p className={`text-5xl font-bold ${fngColor(parseInt(fngCurrent.value))}`}>{fngCurrent.value}</p>
                  <p className="text-gray-400 text-sm mt-1">{fngCurrent.value_classification}</p>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500" style={{ width: `${fngCurrent.value}%` }} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">7-day history:</p>
                  <div className="flex gap-1">
                    {fngHistory.slice(0, 7).reverse().map((d: any, i: number) => (
                      <div key={i} className="flex-1 text-center">
                        <div className={`text-xs font-bold ${fngColor(parseInt(d.value))}`}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {parseInt(fngCurrent.value) <= 20 && (
                  <div className="mt-4 bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                    <p className="text-red-400 text-sm">🔴 Extreme Fear — Historically a contrarian buy zone</p>
                  </div>
                )}
                {parseInt(fngCurrent.value) >= 80 && (
                  <div className="mt-4 bg-green-900/20 border border-green-800/50 rounded-lg p-3">
                    <p className="text-green-400 text-sm">🟢 Extreme Greed — Consider taking profits</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm">Unable to load F&G data</p>
            )}
          </div>

          {/* Saved Indicators */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-gray-300 mb-4">📡 Wen&apos;s Indicators</h2>
            {indicators.length === 0 ? (
              <p className="text-gray-500 text-sm">No indicators saved yet. Wen will populate these during analysis.</p>
            ) : (
              <div className="space-y-3">
                {indicators.map((ind) => (
                  <div key={ind.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-300">{ind.indicatorName}</p>
                      {ind.source && <p className="text-xs text-gray-600">{ind.source}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{parseFloat(ind.value).toLocaleString()}</p>
                      {ind.signal && <p className="text-xs text-gray-400">{ind.signal}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-gray-300 mb-4">🔥 Trending</h2>
            {trending?.coins ? (
              <div className="space-y-2">
                {trending.coins.slice(0, 8).map((c: any) => (
                  <div key={c.item.id} className="flex justify-between items-center py-1.5 border-b border-gray-800/50 last:border-0">
                    <div className="flex items-center gap-2">
                      {c.item.thumb && <img src={c.item.thumb} alt="" className="w-5 h-5 rounded-full" />}
                      <span className="text-sm text-gray-300">{c.item.name}</span>
                      <span className="text-xs text-gray-500">{c.item.symbol}</span>
                    </div>
                    <span className="text-xs text-gray-500">#{c.item.market_cap_rank ?? "?"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Unable to load trending data</p>
            )}
          </div>
        </div>

        {/* Market Cache (Prices) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-300">💹 Price Cache</h2>
            <p className="text-xs text-gray-600 mt-1">Updated by Wen during analysis cycles</p>
          </div>
          {cached.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No cached prices. Wen will populate during next analysis.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase">Coin</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Price</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">24h Change</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Market Cap</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Volume 24h</th>
                    <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cached.map((c) => {
                    const change = c.priceChange24h ? parseFloat(c.priceChange24h) : 0;
                    return (
                      <tr key={c.coinId} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium">{c.coinId} <span className="text-gray-500 text-xs">({c.symbol})</span></td>
                        <td className="px-4 py-3 text-right">${parseFloat(c.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-3 text-right ${change >= 0 ? "text-green-400" : "text-red-400"}`}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-gray-400">{c.marketCap ? `$${(parseFloat(c.marketCap) / 1e9).toFixed(1)}B` : "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{c.volume24h ? `$${(parseFloat(c.volume24h) / 1e6).toFixed(0)}M` : "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs">{c.lastUpdated?.toLocaleString()}</td>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-xl font-bold mt-1 text-white">{value}</p>
    </div>
  );
}
