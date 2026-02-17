import { pgTable, uuid, text, timestamp, integer, decimal, date, boolean, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";

// Auth tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
}, (t) => [uniqueIndex("acct_provider_unique").on(t.provider, t.providerAccountId)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").unique().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").unique().notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

// Holdings
export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  coinId: text("coin_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  bucket: text("bucket", { enum: ["long-term", "short-term"] }).notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 10 }).notNull().default("0"),
  avgBuyPrice: decimal("avg_buy_price", { precision: 20, scale: 10 }).notNull().default("0"),
  costBasis: decimal("cost_basis", { precision: 20, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("holdings_user_coin_bucket").on(t.userId, t.coinId, t.bucket), index("idx_holdings_user").on(t.userId)]);

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  holdingId: uuid("holding_id").references(() => holdings.id),
  coinId: text("coin_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  bucket: text("bucket", { enum: ["long-term", "short-term"] }).notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 10 }).notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 20, scale: 10 }).notNull(),
  totalValue: decimal("total_value", { precision: 20, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 2 }).default("0"),
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 2 }),
  notes: text("notes"),
  tradedAt: timestamp("traded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_tx_user").on(t.userId), index("idx_tx_holding").on(t.holdingId), index("idx_tx_date").on(t.tradedAt)]);

// Portfolio Snapshots
export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  totalValue: decimal("total_value", { precision: 20, scale: 2 }).notNull(),
  totalCostBasis: decimal("total_cost_basis", { precision: 20, scale: 2 }).notNull(),
  totalUnrealizedPnl: decimal("total_unrealized_pnl", { precision: 20, scale: 2 }).notNull(),
  totalRealizedPnl: decimal("total_realized_pnl", { precision: 20, scale: 2 }).notNull().default("0"),
  longTermValue: decimal("long_term_value", { precision: 20, scale: 2 }).notNull().default("0"),
  shortTermValue: decimal("short_term_value", { precision: 20, scale: 2 }).notNull().default("0"),
  totalCosts: decimal("total_costs", { precision: 20, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("snapshots_user_date").on(t.userId, t.snapshotDate)]);

// Cost Items
export const costItems = pgTable("cost_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency", { enum: ["one-time", "monthly", "annual"] }).notNull(),
  category: text("category"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("idx_costs_user").on(t.userId)]);

// Market Cache
export const marketCache = pgTable("market_cache", {
  coinId: text("coin_id").primaryKey(),
  symbol: text("symbol").notNull(),
  priceUsd: decimal("price_usd", { precision: 20, scale: 10 }).notNull(),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 4 }),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 20, scale: 2 }),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});
