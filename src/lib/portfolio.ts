import type { CoinPrice } from "./market";

export interface HoldingWithPrice {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  bucket: "long-term" | "short-term";
  quantity: number;
  avgBuyPrice: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  portfolioPct: number;
}

export function enrichHoldings(
  holdings: { id: string; coinId: string; symbol: string; name: string; bucket: string; quantity: string; avgBuyPrice: string; costBasis: string }[],
  prices: Map<string, CoinPrice>
): HoldingWithPrice[] {
  const enriched = holdings.map((h) => {
    const qty = parseFloat(h.quantity);
    const avg = parseFloat(h.avgBuyPrice);
    const cost = parseFloat(h.costBasis);
    const price = prices.get(h.coinId)?.priceUsd ?? avg;
    const value = qty * price;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? ((value / cost) - 1) * 100 : 0;
    return {
      id: h.id, coinId: h.coinId, symbol: h.symbol, name: h.name,
      bucket: h.bucket as "long-term" | "short-term",
      quantity: qty, avgBuyPrice: avg, costBasis: cost,
      currentPrice: price, currentValue: value,
      unrealizedPnl: pnl, unrealizedPnlPct: pnlPct, portfolioPct: 0,
    };
  });

  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0);
  enriched.forEach((h) => { h.portfolioPct = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0; });
  return enriched;
}

export function calcAllocation(holdings: HoldingWithPrice[]) {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const ltValue = holdings.filter((h) => h.bucket === "long-term").reduce((s, h) => s + h.currentValue, 0);
  const stValue = holdings.filter((h) => h.bucket === "short-term").reduce((s, h) => s + h.currentValue, 0);
  return {
    totalValue,
    longTerm: { value: ltValue, pct: totalValue > 0 ? (ltValue / totalValue) * 100 : 0 },
    shortTerm: { value: stValue, pct: totalValue > 0 ? (stValue / totalValue) * 100 : 0 },
    deviation: totalValue > 0 ? Math.abs((ltValue / totalValue) * 100 - 50) : 0,
  };
}

export function calcPortfolioStats(holdings: HoldingWithPrice[], totalCosts: number) {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCostBasis = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalUnrealizedPnl = totalValue - totalCostBasis;
  const unrealizedPnlPct = totalCostBasis > 0 ? ((totalValue / totalCostBasis) - 1) * 100 : 0;
  const netROI = totalCostBasis > 0 ? ((totalValue - totalCostBasis - totalCosts) / totalCostBasis) * 100 : 0;

  return { totalValue, totalCostBasis, totalUnrealizedPnl, unrealizedPnlPct, totalCosts, netROI };
}
