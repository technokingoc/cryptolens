import { db } from "@/db";
import { marketCache } from "@/db/schema";
import { inArray } from "drizzle-orm";

const COINGECKO = "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS = 60_000;

export interface CoinPrice {
  coinId: string;
  symbol: string;
  priceUsd: number;
  priceChange24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  stale?: boolean;
}

export async function fetchAndCachePrices(coinIds: string[]): Promise<Map<string, CoinPrice>> {
  if (coinIds.length === 0) return new Map();

  // Check cache first
  const cached = await db.select().from(marketCache).where(inArray(marketCache.coinId, coinIds));
  const now = Date.now();
  const fresh = new Map<string, CoinPrice>();
  const staleIds: string[] = [];

  for (const c of cached) {
    const age = now - new Date(c.lastUpdated).getTime();
    if (age < CACHE_TTL_MS) {
      fresh.set(c.coinId, {
        coinId: c.coinId, symbol: c.symbol,
        priceUsd: parseFloat(c.priceUsd), priceChange24h: c.priceChange24h ? parseFloat(c.priceChange24h) : null,
        marketCap: c.marketCap ? parseFloat(c.marketCap) : null, volume24h: c.volume24h ? parseFloat(c.volume24h) : null,
      });
    } else {
      staleIds.push(c.coinId);
    }
  }

  const missingIds = coinIds.filter((id) => !fresh.has(id));
  const toFetch = [...new Set([...staleIds, ...missingIds])];

  if (toFetch.length > 0) {
    try {
      const url = `${COINGECKO}/simple/price?ids=${toFetch.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();

      for (const coinId of toFetch) {
        const d = data[coinId];
        if (!d) continue;
        const price: CoinPrice = {
          coinId, symbol: coinId.substring(0, 6).toUpperCase(),
          priceUsd: d.usd ?? 0, priceChange24h: d.usd_24h_change ?? null,
          marketCap: d.usd_market_cap ?? null, volume24h: d.usd_24h_vol ?? null,
        };
        fresh.set(coinId, price);

        // Upsert cache
        await db.insert(marketCache).values({
          coinId, symbol: price.symbol, priceUsd: String(price.priceUsd),
          priceChange24h: price.priceChange24h != null ? String(price.priceChange24h) : null,
          marketCap: price.marketCap != null ? String(price.marketCap) : null,
          volume24h: price.volume24h != null ? String(price.volume24h) : null,
          lastUpdated: new Date(),
        }).onConflictDoUpdate({
          target: marketCache.coinId,
          set: {
            priceUsd: String(price.priceUsd),
            priceChange24h: price.priceChange24h != null ? String(price.priceChange24h) : null,
            marketCap: price.marketCap != null ? String(price.marketCap) : null,
            volume24h: price.volume24h != null ? String(price.volume24h) : null,
            lastUpdated: new Date(),
          },
        });
      }
    } catch {
      // Return stale cache on failure
      for (const c of cached) {
        if (!fresh.has(c.coinId)) {
          fresh.set(c.coinId, {
            coinId: c.coinId, symbol: c.symbol,
            priceUsd: parseFloat(c.priceUsd), priceChange24h: c.priceChange24h ? parseFloat(c.priceChange24h) : null,
            marketCap: c.marketCap ? parseFloat(c.marketCap) : null, volume24h: c.volume24h ? parseFloat(c.volume24h) : null,
            stale: true,
          });
        }
      }
    }
  }

  return fresh;
}
