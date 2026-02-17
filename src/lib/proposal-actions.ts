"use server";
import { db } from "@/db";
import { tradeProposals } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveProposal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const proposalId = formData.get("proposalId") as string;
  await db.update(tradeProposals).set({
    status: "approved",
    founderDecision: "APPROVED",
    decidedAt: new Date(),
  }).where(eq(tradeProposals.id, proposalId));
  
  revalidatePath("/proposals");
  revalidatePath("/dashboard");
}

export async function rejectProposal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const proposalId = formData.get("proposalId") as string;
  await db.update(tradeProposals).set({
    status: "rejected",
    founderDecision: "REJECTED",
    decidedAt: new Date(),
  }).where(eq(tradeProposals.id, proposalId));
  
  revalidatePath("/proposals");
  revalidatePath("/dashboard");
}
