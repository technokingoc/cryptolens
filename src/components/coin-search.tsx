"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

type Coin = { id: string; symbol: string; name: string; thumb?: string; market_cap_rank?: number };

const POPULAR_COINS: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", market_cap_rank: 1 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", market_cap_rank: 2 },
  { id: "solana", symbol: "SOL", name: "Solana", market_cap_rank: 5 },
  { id: "binancecoin", symbol: "BNB", name: "BNB", market_cap_rank: 4 },
  { id: "ripple", symbol: "XRP", name: "XRP", market_cap_rank: 3 },
  { id: "cardano", symbol: "ADA", name: "Cardano", market_cap_rank: 8 },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", market_cap_rank: 7 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", market_cap_rank: 12 },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", market_cap_rank: 10 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", market_cap_rank: 14 },
  { id: "tron", symbol: "TRX", name: "TRON", market_cap_rank: 9 },
  { id: "polygon-ecosystem-token", symbol: "POL", name: "Polygon", market_cap_rank: 30 },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", market_cap_rank: 20 },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", market_cap_rank: 22 },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos", market_cap_rank: 25 },
  { id: "stellar", symbol: "XLM", name: "Stellar", market_cap_rank: 15 },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol", market_cap_rank: 18 },
  { id: "sui", symbol: "SUI", name: "Sui", market_cap_rank: 11 },
  { id: "aptos", symbol: "APT", name: "Aptos", market_cap_rank: 28 },
  { id: "render-token", symbol: "RENDER", name: "Render", market_cap_rank: 26 },
];

interface CoinSearchProps {
  locale: "en" | "pt";
  onSelect: (coin: Coin) => void;
  selected: Coin | null;
}

export function CoinSearch({ locale, onSelect, selected }: CoinSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coin[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults(POPULAR_COINS.slice(0, 8));
      setOpen(true);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const lower = q.toLowerCase();
      const local = POPULAR_COINS.filter(
        c => c.name.toLowerCase().includes(lower) || c.symbol.toLowerCase().includes(lower) || c.id.includes(lower)
      );
      if (local.length >= 3) {
        setResults(local.slice(0, 8));
        setOpen(true);
        return;
      }
      setLoading(true);
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`);
        const data = await r.json();
        const coins: Coin[] = (data.coins ?? []).slice(0, 8).map((c: any) => ({
          id: c.id, symbol: c.symbol?.toUpperCase(), name: c.name, thumb: c.thumb, market_cap_rank: c.market_cap_rank
        }));
        setResults(coins.length ? coins : local);
      } catch {
        setResults(local);
      } finally {
        setLoading(false);
      }
      setOpen(true);
    }, 350);
  };

  const select = (coin: Coin) => {
    onSelect(coin);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onSelect({ id: "", symbol: "", name: "" });
    setQuery("");
  };

  if (selected?.id) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        {selected.thumb && <img src={selected.thumb} alt="" className="w-5 h-5 rounded-full" />}
        <span className="text-sm font-medium text-gray-900">{selected.name}</span>
        <span className="text-xs text-gray-400">{selected.symbol}</span>
        <button type="button" onClick={clear} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (!query) { setResults(POPULAR_COINS.slice(0, 8)); setOpen(true); } }}
          placeholder={locale === "pt" ? "Buscar moeda..." : "Search coin..."}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {!query && <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide">{locale === "pt" ? "Popular" : "Popular"}</p>}
          {results.map(c => (
            <button key={c.id} type="button" onClick={() => select(c)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              {c.thumb && <img src={c.thumb} alt="" className="w-5 h-5 rounded-full" />}
              <span className="text-sm font-medium text-gray-900">{c.name}</span>
              <span className="text-xs text-gray-400">{c.symbol}</span>
              {c.market_cap_rank && <span className="ml-auto text-[10px] text-gray-300">#{c.market_cap_rank}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
