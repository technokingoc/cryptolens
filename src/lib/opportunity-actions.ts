"use server";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function watchOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.update(opportunities).set({ status: "watching", updatedAt: new Date() }).where(eq(opportunities.id, formData.get("id") as string));
  revalidatePath("/opportunities");
}

export async function passOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.update(opportunities).set({ status: "passed", updatedAt: new Date() }).where(eq(opportunities.id, formData.get("id") as string));
  revalidatePath("/opportunities");
}
