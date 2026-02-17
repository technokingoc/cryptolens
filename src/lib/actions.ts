"use server";
import { db } from "@/db";
import { holdings, transactions, costItems } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Bucket = "long-term" | "short-term";
type TxType = "BUY" | "SELL";
type Frequency = "one-time" | "monthly" | "annual";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// Holdings + Transactions
export async function recordTransaction(formData: FormData) {
  const userId = await getUserId();
  const coinId = formData.get("coinId") as string;
  const symbol = (formData.get("symbol") as string).toUpperCase();
  const name = formData.get("name") as string;
  const type = formData.get("type") as TxType;
  const bucket = formData.get("bucket") as Bucket;
  const quantity = parseFloat(formData.get("quantity") as string);
  const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
  const totalValue = quantity * pricePerUnit;
  const fee = parseFloat((formData.get("fee") as string) || "0");
  const notes = formData.get("notes") as string;

  // Find or create holding
  let [holding] = await db.select().from(holdings).where(
    and(eq(holdings.userId, userId), eq(holdings.coinId, coinId), eq(holdings.bucket, bucket))
  );

  let realizedPnl: number | null = null;

  if (type === "BUY") {
    if (holding) {
      const oldQty = parseFloat(holding.quantity);
      const oldAvg = parseFloat(holding.avgBuyPrice);
      const oldCost = parseFloat(holding.costBasis);
      const newQty = oldQty + quantity;
      const newCost = oldCost + totalValue + fee;
      const newAvg = newQty > 0 ? newCost / newQty : 0;
      await db.update(holdings).set({
        quantity: String(newQty), avgBuyPrice: String(newAvg), costBasis: String(newCost), isActive: true, updatedAt: new Date(),
      }).where(eq(holdings.id, holding.id));
    } else {
      const avg = (totalValue + fee) / quantity;
      [holding] = await db.insert(holdings).values({
        userId, coinId, symbol, name, bucket, quantity: String(quantity),
        avgBuyPrice: String(avg), costBasis: String(totalValue + fee),
      }).returning();
    }
  } else {
    // SELL
    if (!holding) throw new Error("No holding to sell");
    const oldQty = parseFloat(holding.quantity);
    const oldAvg = parseFloat(holding.avgBuyPrice);
    const oldCost = parseFloat(holding.costBasis);
    const newQty = oldQty - quantity;
    realizedPnl = (pricePerUnit - oldAvg) * quantity - fee;
    const costReduced = oldAvg * quantity;
    await db.update(holdings).set({
      quantity: String(Math.max(0, newQty)), costBasis: String(Math.max(0, oldCost - costReduced)),
      isActive: newQty > 0, updatedAt: new Date(),
    }).where(eq(holdings.id, holding.id));
  }

  await db.insert(transactions).values({
    userId, holdingId: holding.id, coinId, symbol, type, bucket,
    quantity: String(quantity), pricePerUnit: String(pricePerUnit), totalValue: String(totalValue),
    fee: String(fee), realizedPnl: realizedPnl != null ? String(realizedPnl) : null, notes,
  });

  revalidatePath("/holdings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/holdings");
}

// Cost Items
export async function addCostItem(formData: FormData) {
  const userId = await getUserId();
  await db.insert(costItems).values({
    userId, name: formData.get("name") as string, description: formData.get("description") as string,
    amount: formData.get("amount") as string, frequency: (formData.get("frequency") as string) as Frequency,
    category: formData.get("category") as string, startDate: formData.get("startDate") as string,
  });
  revalidatePath("/costs");
  revalidatePath("/dashboard");
}

export async function getTotalMonthlyCosts(userId: string): Promise<number> {
  const items = await db.select().from(costItems).where(and(eq(costItems.userId, userId), eq(costItems.isActive, true)));
  return items.reduce((total, item) => {
    const amt = parseFloat(item.amount);
    if (item.frequency === "monthly") return total + amt;
    if (item.frequency === "annual") return total + amt / 12;
    return total; // one-time not included in monthly
  }, 0);
}
