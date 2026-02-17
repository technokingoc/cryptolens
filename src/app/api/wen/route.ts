export const dynamic = "force-dynamic";
import { db } from "@/db";
import { tradeProposals, marketIndicators, analysisReports, marketCache } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// Simple API key auth for Wen
const API_KEY = process.env.WEN_API_KEY || "wen-internal-key-2026";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key");
  return key === API_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "proposal": {
        const [created] = await db.insert(tradeProposals).values({
          userId: body.userId,
          coinId: body.coinId,
          symbol: body.symbol,
          action: body.tradeAction, // BUY/SELL
          bucket: body.bucket,
          confluenceScore: String(body.confluenceScore),
          signal: body.signal,
          thesis: body.thesis,
          entryPrice: body.entryPrice ? String(body.entryPrice) : null,
          stopLoss: body.stopLoss ? String(body.stopLoss) : null,
          target1: body.target1 ? String(body.target1) : null,
          target2: body.target2 ? String(body.target2) : null,
          positionSizePct: body.positionSizePct ? String(body.positionSizePct) : null,
          timeHorizon: body.timeHorizon,
          maxLoss: body.maxLoss ? String(body.maxLoss) : null,
          expectedGain: body.expectedGain ? String(body.expectedGain) : null,
          riskReward: body.riskReward,
          pillarTechnical: body.pillars?.technical ?? 0,
          pillarNarrative: body.pillars?.narrative ?? 0,
          pillarSentiment: body.pillars?.sentiment ?? 0,
          pillarOnchain: body.pillars?.onchain ?? 0,
          pillarMacro: body.pillars?.macro ?? 0,
          pillarFundamentals: body.pillars?.fundamentals ?? 0,
          pillarRiskreward: body.pillars?.riskreward ?? 0,
          pillarNotes: body.pillarNotes ?? null,
          risks: body.risks ?? [],
        }).returning();
        return NextResponse.json({ ok: true, id: created.id });
      }

      case "indicator": {
        await db.insert(marketIndicators).values({
          indicatorName: body.name,
          value: String(body.value),
          label: body.label,
          signal: body.signal,
          source: body.source,
        }).onConflictDoUpdate({
          target: marketIndicators.indicatorName,
          set: {
            value: String(body.value),
            label: body.label,
            signal: body.signal,
            source: body.source,
            recordedAt: new Date(),
          },
        });
        return NextResponse.json({ ok: true });
      }

      case "report": {
        const [report] = await db.insert(analysisReports).values({
          userId: body.userId,
          title: body.title,
          reportType: body.reportType,
          content: body.content,
          marketSnapshot: body.marketSnapshot ?? null,
        }).returning();
        return NextResponse.json({ ok: true, id: report.id });
      }

      case "cache": {
        for (const coin of body.coins ?? []) {
          await db.insert(marketCache).values({
            coinId: coin.coinId,
            symbol: coin.symbol,
            priceUsd: String(coin.price),
            priceChange24h: coin.change24h != null ? String(coin.change24h) : null,
            marketCap: coin.marketCap != null ? String(coin.marketCap) : null,
            volume24h: coin.volume24h != null ? String(coin.volume24h) : null,
            lastUpdated: new Date(),
          }).onConflictDoUpdate({
            target: marketCache.coinId,
            set: {
              priceUsd: String(coin.price),
              priceChange24h: coin.change24h != null ? String(coin.change24h) : null,
              marketCap: coin.marketCap != null ? String(coin.marketCap) : null,
              volume24h: coin.volume24h != null ? String(coin.volume24h) : null,
              lastUpdated: new Date(),
            },
          });
        }
        return NextResponse.json({ ok: true, cached: body.coins?.length ?? 0 });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");
  
  if (type === "indicators") {
    const rows = await db.select().from(marketIndicators);
    return NextResponse.json(rows);
  }
  if (type === "proposals") {
    const userId = req.nextUrl.searchParams.get("userId") || "";
    const rows = await db.select().from(tradeProposals).where(eq(tradeProposals.userId, userId));
    return NextResponse.json(rows);
  }

  return NextResponse.json({ endpoints: ["POST proposal", "POST indicator", "POST report", "POST cache", "GET ?type=indicators", "GET ?type=proposals&userId="] });
}
