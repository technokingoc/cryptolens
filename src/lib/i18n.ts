export type Locale = "en" | "pt";

const dict = {
  // Nav
  dashboard: { en: "Dashboard", pt: "Painel" },
  marketIntel: { en: "Market Intel", pt: "Inteligência de Mercado" },
  tradeProposals: { en: "Trade Proposals", pt: "Propostas de Trade" },
  holdings: { en: "Holdings", pt: "Carteira" },
  transactions: { en: "Transactions", pt: "Transações" },
  opportunities: { en: "Opportunities", pt: "Oportunidades" },
  reports: { en: "Reports", pt: "Relatórios" },
  costs: { en: "Costs", pt: "Custos" },
  risk: { en: "Risk", pt: "Risco" },
  settings: { en: "Settings", pt: "Configurações" },
  more: { en: "More", pt: "Mais" },
  navOverview: { en: "Overview", pt: "Visão Geral" },
  navIntelligence: { en: "Intelligence", pt: "Inteligência" },
  navPortfolio: { en: "Portfolio", pt: "Portfólio" },
  navAnalysis: { en: "Analysis", pt: "Análise" },

  // Dashboard
  totalValue: { en: "Total Value", pt: "Valor Total" },
  invested: { en: "Invested", pt: "Investido" },
  unrealizedPnl: { en: "Unrealized P&L", pt: "P&L Não Realizado" },
  netROI: { en: "Net ROI", pt: "ROI Líquido" },
  fearGreed: { en: "Fear & Greed", pt: "Medo & Ganância" },
  portfolio: { en: "Portfolio", pt: "Portfólio" },
  market: { en: "Market", pt: "Mercado" },
  overview: { en: "Overview", pt: "Visão Geral" },
  pendingProposals: { en: "Pending Proposals", pt: "Propostas Pendentes" },
  awaitingDecision: { en: "Awaiting Your Decision", pt: "Aguardando Sua Decisão" },
  allocation: { en: "Allocation", pt: "Alocação" },
  topMovers: { en: "Top Movers", pt: "Maiores Movimentos" },
  noHoldings: { en: "No holdings yet", pt: "Sem ativos ainda" },
  marketIndicators: { en: "Market Indicators", pt: "Indicadores de Mercado" },
  viewAll: { en: "View all", pt: "Ver todos" },

  // Holdings
  recordTransaction: { en: "Record Transaction", pt: "Registrar Transação" },
  recordFirst: { en: "Record your first transaction", pt: "Registre sua primeira transação" },
  noHoldingsYet: { en: "No holdings yet", pt: "Sem ativos ainda" },
  asset: { en: "Asset", pt: "Ativo" },
  bucket: { en: "Bucket", pt: "Categoria" },
  quantity: { en: "Quantity", pt: "Quantidade" },
  avgBuy: { en: "Avg Buy", pt: "Compra Média" },
  current: { en: "Current", pt: "Atual" },
  value: { en: "Value", pt: "Valor" },
  pnl: { en: "P&L", pt: "L&P" },
  pnlPct: { en: "P&L %", pt: "L&P %" },
  weight: { en: "Weight", pt: "Peso" },
  long: { en: "Long", pt: "Longo" },
  short: { en: "Short", pt: "Curto" },

  // Transactions
  newTx: { en: "New", pt: "Nova" },
  noTransactions: { en: "No transactions yet", pt: "Sem transações ainda" },
  date: { en: "Date", pt: "Data" },
  type: { en: "Type", pt: "Tipo" },
  price: { en: "Price", pt: "Preço" },
  total: { en: "Total", pt: "Total" },
  all: { en: "All", pt: "Todos" },
  buy: { en: "BUY", pt: "COMPRA" },
  sell: { en: "SELL", pt: "VENDA" },

  // Proposals
  pending: { en: "Pending", pt: "Pendente" },
  approved: { en: "Approved", pt: "Aprovado" },
  rejected: { en: "Rejected", pt: "Rejeitado" },
  history: { en: "History", pt: "Histórico" },
  noProposals: { en: "No pending proposals", pt: "Sem propostas pendentes" },
  submitsWhen: { en: "Wen submits proposals when confluence > +0.5", pt: "Wen envia propostas quando confluência > +0.5" },
  approve: { en: "Approve", pt: "Aprovar" },
  reject: { en: "Reject", pt: "Rejeitar" },
  confluence: { en: "Confluence", pt: "Confluência" },
  thesis: { en: "Thesis", pt: "Tese" },
  confluenceBreakdown: { en: "Confluence Breakdown", pt: "Detalhamento de Confluência" },
  executionPlan: { en: "Execution Plan", pt: "Plano de Execução" },
  risks: { en: "Risks", pt: "Riscos" },
  founderDecision: { en: "Founder Decision", pt: "Decisão do Fundador" },
  action: { en: "Action", pt: "Ação" },
  horizon: { en: "Horizon", pt: "Horizonte" },
  reviewDecide: { en: "Review and decide.", pt: "Revise e decida." },

  // Market
  totalMarketCap: { en: "Total Market Cap", pt: "Cap. de Mercado Total" },
  volume24h: { en: "24h Volume", pt: "Volume 24h" },
  btcDominance: { en: "BTC Dominance", pt: "Dominância BTC" },
  ethDominance: { en: "ETH Dominance", pt: "Dominância ETH" },
  fearGreedIndex: { en: "Fear & Greed Index", pt: "Índice de Medo & Ganância" },
  dayTrend: { en: "7-day trend", pt: "Tendência 7 dias" },
  extremeFear: { en: "Extreme Fear — Historically a contrarian buy zone", pt: "Medo Extremo — Historicamente zona de compra contrária" },
  wensIndicators: { en: "Wen's Indicators", pt: "Indicadores do Wen" },
  willPopulate: { en: "Wen will populate during analysis.", pt: "Wen irá preencher durante análise." },
  trending: { en: "Trending", pt: "Em Alta" },
  unableToLoad: { en: "Unable to load", pt: "Falha ao carregar" },
  priceCache: { en: "Price Cache", pt: "Cache de Preços" },
  updatedByWen: { en: "Updated by Wen during analysis", pt: "Atualizado pelo Wen durante análise" },
  noCachedPrices: { en: "No cached prices yet.", pt: "Sem preços em cache." },
  change24h: { en: "24h", pt: "24h" },
  mCap: { en: "MCap", pt: "Cap." },
  volume: { en: "Volume", pt: "Volume" },

  // Risk
  riskDashboard: { en: "Risk Dashboard", pt: "Painel de Risco" },
  noHoldingsToAnalyze: { en: "No holdings to analyze.", pt: "Sem ativos para analisar." },
  bucketBalance: { en: "Bucket Balance", pt: "Balanço de Categorias" },
  targetBalance: { en: "Target: 50/50", pt: "Meta: 50/50" },
  concentrationRisk: { en: "Concentration Risk", pt: "Risco de Concentração" },
  fullExposure: { en: "Full Exposure", pt: "Exposição Completa" },
  withinRange: { en: "Within acceptable range", pt: "Dentro da faixa aceitável" },
  considerRebalancing: { en: "Consider rebalancing.", pt: "Considere rebalancear." },
  highConcentration: { en: "High concentration (>30%)", pt: "Alta concentração (>30%)" },
  deviation: { en: "Deviation", pt: "Desvio" },
  longTerm: { en: "Long-term", pt: "Longo prazo" },
  shortTerm: { en: "Short-term", pt: "Curto prazo" },

  // Costs
  operatingCosts: { en: "Operating Costs", pt: "Custos Operacionais" },
  monthlyBurn: { en: "Monthly burn", pt: "Gasto mensal" },
  addCostItem: { en: "Add Cost Item", pt: "Adicionar Custo" },
  name: { en: "Name", pt: "Nome" },
  amount: { en: "Amount (USD)", pt: "Valor (USD)" },
  frequency: { en: "Frequency", pt: "Frequência" },
  monthly: { en: "Monthly", pt: "Mensal" },
  annual: { en: "Annual", pt: "Anual" },
  oneTime: { en: "One-time", pt: "Único" },
  category: { en: "Category", pt: "Categoria" },
  description: { en: "Description", pt: "Descrição" },
  status: { en: "Status", pt: "Status" },
  active: { en: "Active", pt: "Ativo" },
  ended: { en: "Ended", pt: "Encerrado" },
  addCost: { en: "Add Cost", pt: "Adicionar Custo" },

  // Opportunities
  opportunitiesTitle: { en: "Opportunities", pt: "Oportunidades" },
  opportunitiesDesc: { en: "Early-stage protocols & coins detected by Wen's scanner — rug-pull risk assessed", pt: "Protocolos e moedas iniciais detectados pelo scanner do Wen — risco de rug-pull avaliado" },
  noActiveOpps: { en: "No active opportunities", pt: "Sem oportunidades ativas" },
  scansDesc: { en: "Wen scans DefiLlama & CoinGecko for early-stage protocols with rug-pull detection", pt: "Wen busca no DefiLlama & CoinGecko protocolos iniciais com detecção de rug-pull" },
  watch: { en: "Watch", pt: "Observar" },
  skip: { en: "Skip", pt: "Pular" },
  riskAssessment: { en: "Risk Assessment", pt: "Avaliação de Risco" },
  wensVerdict: { en: "Wen's Verdict", pt: "Parecer do Wen" },

  // Reports
  analysisReports: { en: "Analysis Reports", pt: "Relatórios de Análise" },
  noReports: { en: "No reports yet", pt: "Sem relatórios ainda" },
  reportsDesc: { en: "Market reports and analysis from Wen", pt: "Relatórios de mercado e análises do Wen" },
  savesReports: { en: "Wen saves reports during analysis cycles", pt: "Wen salva relatórios durante ciclos de análise" },

  // Settings
  configSoon: { en: "Configurable settings coming soon.", pt: "Configurações editáveis em breve." },

  // Shared/page copy
  recordTx: { en: "Record Transaction", pt: "Registrar Transação" },
  back: { en: "Back", pt: "Voltar" },
  notes: { en: "Notes", pt: "Notas" },
  optionalNotes: { en: "Optional notes...", pt: "Notas opcionais..." },
  coinId: { en: "Coin ID (CoinGecko)", pt: "ID da Moeda (CoinGecko)" },
  symbol: { en: "Symbol", pt: "Símbolo" },
  longTermAlloc: { en: "Target Long-term Allocation", pt: "Meta de Alocação Longo Prazo" },
  shortTermAlloc: { en: "Target Short-term Allocation", pt: "Meta de Alocação Curto Prazo" },
  baseCurrency: { en: "Base Currency", pt: "Moeda Base" },
  marketDataSource: { en: "Market Data Source", pt: "Fonte de Dados de Mercado" },
  aiAnalyst: { en: "AI Analyst", pt: "Analista de IA" },
  user: { en: "User", pt: "Utilizador" },
  pendingCount: { en: "Pending", pt: "Pendentes" },
  founderDecisionText: { en: "Founder Decision", pt: "Decisão do Fundador" },
  executionEntry: { en: "Entry", pt: "Entrada" },
  executionStopLoss: { en: "Stop-Loss", pt: "Stop-Loss" },
  executionTarget1: { en: "Target 1", pt: "Alvo 1" },
  executionTarget2: { en: "Target 2", pt: "Alvo 2" },
  executionMaxLoss: { en: "Max Loss", pt: "Perda Máx." },
  executionExpGain: { en: "Exp. Gain", pt: "Ganho Est." },
  executionPosition: { en: "Position %", pt: "% da Posição" },
  reviewAndDecideDesc: { en: "Wen's confluence-scored recommendations. Review and decide.", pt: "Recomendações do Wen com pontuação de confluência. Revise e decida." },
  marketIntelligence: { en: "Market Intelligence", pt: "Inteligência de Mercado" },
  analysisReportsTitle: { en: "Analysis Reports", pt: "Relatórios de Análise" },

  // Common
  signOut: { en: "Sign out", pt: "Sair" },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, locale: Locale = "en"): string {
  return dict[key]?.[locale] ?? key;
}

export function getLocaleFromCookie(cookieValue?: string): Locale {
  if (cookieValue === "pt") return "pt";
  return "en";
}
