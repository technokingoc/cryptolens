export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { marketCache, marketIndicators } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { Globe, TrendingUp, Radio, BarChart3, Activity, Coins, PieChart, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";

async function fetchFearGreed() {
  try { const r = await fetch("https://api.alternative.me/fng/?limit=7", { next: { revalidate: 300 } }); return await r.json(); } catch { return null; }
}
async function fetchGlobalData() {
  try { const r = await fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 120 } }); return await r.json(); } catch { return null; }
}
async function fetchTrending() {
  try { const r = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 300 } }); return await r.json(); } catch { return null; }
}

const extraLabels = {
  globalStats: { en: "Global Market Stats", pt: "Estatísticas Globais" },
  activeCryptos: { en: "Active Cryptos", pt: "Criptos Ativos" },
  markets: { en: "Markets", pt: "Mercados" },
  marketCapChange: { en: "24h MCap Change", pt: "Var. MCap 24h" },
  trendingCoins: { en: "Trending Coins", pt: "Moedas em Alta" },
  trendingNfts: { en: "Trending NFTs", pt: "NFTs em Alta" },
  rank: { en: "Rank", pt: "Rank" },
  price24h: { en: "24h", pt: "24h" },
};

function el(key: keyof typeof extraLabels, locale: Locale) { return extraLabels[key][locale]; }

export default async function MarketPage() {
  const session = await auth();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const [cached, indicators, fng, global, trending] = await Promise.all([
    db.select().from(marketCache).orderBy(desc(marketCache.lastUpdated)),
    db.select().from(marketIndicators),
    fetchFearGreed(), fetchGlobalData(), fetchTrending(),
  ]);

  const fngCurrent = fng?.data?.[0];
  const fngHistory = fng?.data ?? [];
  const gd = global?.data;

  const fngColor = (v: number) => v <= 20 ? "text-red-500" : v <= 40 ? "text-orange-500" : v <= 60 ? "text-yellow-600" : v <= 80 ? "text-emerald-600" : "text-emerald-500";

  const trendingCoins = trending?.coins?.slice(0, 10) ?? [];
  const trendingNfts = trending?.nfts?.slice(0, 5) ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Market" }]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Globe className="w-6 h-6 text-gray-400" /> {t("marketIntelligence", locale)}</h1>
        </div>

        {/* Global Stats Cards */}
        {gd && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <StatCard icon={<Coins className="w-4 h-4 text-blue-500" />} label={t("totalMarketCap", locale)} value={`$${(gd.total_market_cap?.usd / 1e12).toFixed(2)}T`} />
            <StatCard icon={<Activity className="w-4 h-4 text-purple-500" />} label={t("volume24h", locale)} value={`$${(gd.total_volume?.usd / 1e9).toFixed(0)}B`} />
            <StatCard icon={<PieChart className="w-4 h-4 text-orange-500" />} label={t("btcDominance", locale)} value={`${gd.market_cap_percentage?.btc?.toFixed(1)}%`} />
            <StatCard icon={<PieChart className="w-4 h-4 text-indigo-500" />} label={t("ethDominance", locale)} value={`${gd.market_cap_percentage?.eth?.toFixed(1)}%`} />
            <StatCard icon={<Flame className="w-4 h-4 text-emerald-500" />} label={el("activeCryptos", locale)} value={gd.active_cryptocurrencies?.toLocaleString() ?? "—"} />
            <StatCard
              icon={gd.market_cap_change_percentage_24h_usd >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
              label={el("marketCapChange", locale)}
              value={`${gd.market_cap_change_percentage_24h_usd >= 0 ? "+" : ""}${gd.market_cap_change_percentage_24h_usd?.toFixed(2)}%`}
              valueColor={gd.market_cap_change_percentage_24h_usd >= 0 ? "text-emerald-600" : "text-red-500"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Fear & Greed */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {t("fearGreedIndex", locale)}</h2>
            {fngCurrent ? (
              <>
                <div className="text-center mb-4">
                  <p className={`text-5xl font-bold ${fngColor(parseInt(fngCurrent.value))}`}>{fngCurrent.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{fngCurrent.value_classification}</p>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400" style={{ width: `${fngCurrent.value}%` }} />
                </div>
                <p className="text-xs text-gray-400 mb-1">{t("dayTrend", locale)}:</p>
                <div className="flex gap-1">
                  {fngHistory.slice(0, 7).reverse().map((d: { value: string }, i: number) => (
                    <div key={i} className="flex-1 text-center"><div className={`text-xs font-bold ${fngColor(parseInt(d.value))}`}>{d.value}</div></div>
                  ))}
                </div>
                {parseInt(fngCurrent.value) <= 20 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-xs">{t("extremeFear", locale)}</p></div>
                )}
              </>
            ) : <p className="text-gray-400 text-sm">{t("unableToLoad", locale)}</p>}
          </div>

          {/* Wen's Indicators */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-1.5"><Radio className="w-4 h-4" /> {t("wensIndicators", locale)}</h2>
            {indicators.length === 0 ? <p className="text-gray-400 text-sm">{t("willPopulate", locale)}</p> : (
              <div className="space-y-3">
                {indicators.map((ind) => (
                  <div key={ind.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div><p className="text-sm font-medium text-gray-700">{ind.indicatorName}</p>{ind.source && <p className="text-[11px] text-gray-400">{ind.source}</p>}</div>
                    <div className="text-right"><p className="font-bold text-gray-900">{parseFloat(ind.value).toLocaleString()}</p>{ind.signal && <p className="text-[11px] text-gray-500">{ind.signal}</p>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Coins - Enhanced */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> {el("trendingCoins", locale)}</h2>
            {trendingCoins.length > 0 ? (
              <div className="space-y-2">
                {trendingCoins.map((c: any, i: number) => {
                  const item = c.item;
                  const priceChange = item.data?.price_change_percentage_24h?.usd;
                  return (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-300 w-4">{i + 1}</span>
                        {item.thumb && <img src={item.thumb} alt="" className="w-5 h-5 rounded-full" />}
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{item.symbol}</span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {typeof priceChange === "number" && (
                          <span className={`text-xs font-medium ${priceChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">#{item.market_cap_rank ?? "?"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-400 text-sm">{t("unableToLoad", locale)}</p>}
          </div>
        </div>

        {/* Trending NFTs (if available) */}
        {trendingNfts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><Flame className="w-4 h-4 text-pink-500" /> {el("trendingNfts", locale)}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {trendingNfts.map((nft: any) => (
                <div key={nft.id} className="bg-gray-50 rounded-lg p-3 text-center">
                  {nft.thumb && <img src={nft.thumb} alt="" className="w-10 h-10 rounded-lg mx-auto mb-2" />}
                  <p className="text-xs font-medium text-gray-700 truncate">{nft.name}</p>
                  {nft.data?.floor_price && <p className="text-[10px] text-gray-400">{nft.data.floor_price}</p>}
                  {nft.data?.h24_volume && <p className="text-[10px] text-gray-400">Vol: {nft.data.h24_volume}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Cache */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {t("priceCache", locale)}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{t("updatedByWen", locale)}</p>
          </div>
          {cached.length === 0 ? <p className="p-5 text-gray-400 text-sm">{t("noCachedPrices", locale)}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">Coin</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("price", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide">{t("change24h", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden sm:table-cell">{t("mCap", locale)}</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-gray-400 uppercase tracking-wide hidden md:table-cell">{t("volume", locale)}</th>
                </tr></thead>
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

function StatCard({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p></div>
      <p className={`text-xl font-bold ${valueColor ?? "text-gray-900"} mt-1`}>{value}</p>
    </div>
  );
}
