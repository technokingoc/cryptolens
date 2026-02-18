export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tradeProposals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { t, getLocaleFromCookie } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { ProposalsClient } from "@/components/proposals-client";
import { OnboardingHint } from "@/components/onboarding-hint";

export default async function ProposalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("locale")?.value) as Locale;

  const proposals = await db.select().from(tradeProposals).where(eq(tradeProposals.userId, session.user.id)).orderBy(desc(tradeProposals.createdAt));

  // Serialize for client
  const serialized = proposals.map((p) => ({
    ...p,
    confluenceScore: p.confluenceScore,
    createdAt: p.createdAt?.toISOString() ?? null,
    decidedAt: p.decidedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name} locale={locale} />
      <main className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Proposals" }]} />
        <OnboardingHint hintKey="proposals" textKey="onboardingProposalsTip" locale={locale} />
        <ProposalsClient proposals={serialized} locale={locale} />
      </main>
    </div>
  );
}
