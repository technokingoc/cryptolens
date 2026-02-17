import { pgTable, uuid, text, timestamp, integer, decimal, date, boolean, uniqueIndex, index, primaryKey, jsonb } from "drizzle-orm/pg-core";

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

// Trade Proposals (from Wen)
export const tradeProposals = pgTable("trade_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  coinId: text("coin_id").notNull(),
  symbol: text("symbol").notNull(),
  action: text("action").notNull(), // BUY, SELL, HOLD
  bucket: text("bucket").notNull(),
  confluenceScore: decimal("confluence_score", { precision: 5, scale: 2 }).notNull(),
  signal: text("signal").notNull(), // STRONG BUY, MODERATE BUY, NEUTRAL, etc.
  thesis: text("thesis"),
  entryPrice: decimal("entry_price", { precision: 20, scale: 10 }),
  stopLoss: decimal("stop_loss", { precision: 20, scale: 10 }),
  target1: decimal("target_1", { precision: 20, scale: 10 }),
  target2: decimal("target_2", { precision: 20, scale: 10 }),
  positionSizePct: decimal("position_size_pct", { precision: 5, scale: 2 }),
  timeHorizon: text("time_horizon"),
  maxLoss: decimal("max_loss", { precision: 20, scale: 2 }),
  expectedGain: decimal("expected_gain", { precision: 20, scale: 2 }),
  riskReward: text("risk_reward"),
  pillarTechnical: integer("pillar_technical").default(0),
  pillarNarrative: integer("pillar_narrative").default(0),
  pillarSentiment: integer("pillar_sentiment").default(0),
  pillarOnchain: integer("pillar_onchain").default(0),
  pillarMacro: integer("pillar_macro").default(0),
  pillarFundamentals: integer("pillar_fundamentals").default(0),
  pillarRiskreward: integer("pillar_riskreward").default(0),
  pillarNotes: jsonb("pillar_notes"),
  risks: text("risks").array(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, executed, expired
  founderDecision: text("founder_decision"),
  decisionNotes: text("decision_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
}, (t) => [index("idx_proposals_user").on(t.userId), index("idx_proposals_status").on(t.status)]);

// Market Indicators (F&G, DXY, VIX, etc.)
export const marketIndicators = pgTable("market_indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  indicatorName: text("indicator_name").notNull(),
  value: decimal("value", { precision: 20, scale: 4 }).notNull(),
  label: text("label"),
  signal: text("signal"),
  source: text("source"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow(),
}, (t) => [uniqueIndex("idx_indicators_name").on(t.indicatorName)]);

// Analysis Reports (from Wen)
export const analysisReports = pgTable("analysis_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // market_report, trade_analysis, portfolio_review, alert
  content: text("content").notNull(),
  marketSnapshot: jsonb("market_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

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
