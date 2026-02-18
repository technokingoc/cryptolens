export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { OpportunitiesClient } from "@/components/opportunities-client";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { watchOpportunity, passOpportunity } from "@/lib/opportunity-actions";
import { Search } from "lucide-react";
import { OnboardingHint } from "@/components/onboarding-hint";

export default async function OpportunitiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const opps = await db.select().from(opportunities).where(eq(opportunities.userId, session.user.id)).orderBy(desc(opportunities.createdAt));

  const serialized = opps.map((o) => ({
    id: o.id,
    protocolName: o.protocolName,
    symbol: o.symbol,
    status: o.status,
    riskScore: o.riskScore,
    riskFlags: o.riskFlags as string[] | null,
    category: o.category,
    chain: o.chain,
    source: o.source,
    ageDays: o.ageDays,
    tvl: o.tvl,
    tvlChange1d: o.tvlChange1d,
    tvlChange7d: o.tvlChange7d,
    price: o.price,
    mcap: o.mcap,
    volume24h: o.volume24h,
    wenVerdict: o.wenVerdict,
    thesis: o.thesis,
    opportunityScore: o.opportunityScore,
    createdAt: o.createdAt?.toISOString() ?? null,
  }));

  const crumbs = [
    { label: t("dashboard", locale), href: "/dashboard" },
    { label: t("opportunitiesTitle", locale) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <Breadcrumb items={crumbs} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2"><Search className="w-6 h-6 text-gray-400" /> {t("opportunitiesTitle", locale)}</h1>
            <p className="text-gray-400 text-sm">{t("opportunitiesDesc", locale)}</p>
          </div>
        </div>
        <OnboardingHint hintKey="opportunities" textKey="onboardingOpportunitiesTip" locale={locale} />
        <OpportunitiesClient opps={serialized} locale={locale} watchAction={watchOpportunity} passAction={passOpportunity} />
      </main>
    </div>
  );
}
