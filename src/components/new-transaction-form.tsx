"use client";
import { useState, useRef } from "react";
import { CoinSearch } from "./coin-search";
import { Calendar, DollarSign, Hash, FileText, ArrowUpCircle, ArrowDownCircle, Clock, Layers } from "lucide-react";

type Locale = "en" | "pt";

const labels = {
  type: { en: "Type", pt: "Tipo" },
  bucket: { en: "Bucket", pt: "Categoria" },
  coin: { en: "Coin", pt: "Moeda" },
  quantity: { en: "Quantity", pt: "Quantidade" },
  price: { en: "Price (USD)", pt: "Preço (USD)" },
  fee: { en: "Fee (USD)", pt: "Taxa (USD)" },
  date: { en: "Date & Time", pt: "Data & Hora" },
  notes: { en: "Notes", pt: "Notas" },
  notesPlaceholder: { en: "Optional notes...", pt: "Notas opcionais..." },
  buy: { en: "BUY", pt: "COMPRA" },
  sell: { en: "SELL", pt: "VENDA" },
  longTerm: { en: "Long-term", pt: "Longo prazo" },
  shortTerm: { en: "Short-term", pt: "Curto prazo" },
  record: { en: "Record Transaction", pt: "Registrar Transação" },
  total: { en: "Total", pt: "Total" },
  selectCoin: { en: "Select a coin first", pt: "Selecione uma moeda primeiro" },
  qtyError: { en: "Must be > 0", pt: "Deve ser > 0" },
  priceError: { en: "Must be > 0", pt: "Deve ser > 0" },
};

export function NewTransactionForm({ locale, action }: { locale: Locale; action: (formData: FormData) => Promise<void> }) {
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY");
  const [coin, setCoin] = useState<{ id: string; symbol: string; name: string; thumb?: string } | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [qtyTouched, setQtyTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const total = (parseFloat(qty || "0") * parseFloat(price || "0")).toFixed(2);
  const qtyValid = !qtyTouched || parseFloat(qty) > 0;
  const priceValid = !priceTouched || parseFloat(price) > 0;

  const l = (key: keyof typeof labels) => labels[key][locale];

  return (
    <form ref={formRef} action={action} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 max-w-2xl space-y-5">
      {/* Hidden fields for server */}
      <input type="hidden" name="coinId" value={coin?.id ?? ""} />
      <input type="hidden" name="symbol" value={coin?.symbol ?? ""} />
      <input type="hidden" name="name" value={coin?.name ?? ""} />

      {/* Type toggle */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5" /> {l("type")}</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTxType("BUY")}
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${txType === "BUY" ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300" : "bg-gray-50 text-gray-400 border border-gray-200"}`}>
            <ArrowDownCircle className="w-4 h-4 inline mr-1" />{l("buy")}
          </button>
          <button type="button" onClick={() => setTxType("SELL")}
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${txType === "SELL" ? "bg-red-50 text-red-700 border-2 border-red-300" : "bg-gray-50 text-gray-400 border border-gray-200"}`}>
            <ArrowUpCircle className="w-4 h-4 inline mr-1" />{l("sell")}
          </button>
        </div>
        <input type="hidden" name="type" value={txType} />
      </div>

      {/* Bucket */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {l("bucket")}</label>
        <select name="bucket" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="long-term">{l("longTerm")}</option>
          <option value="short-term">{l("shortTerm")}</option>
        </select>
      </div>

      {/* Coin search */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {l("coin")}</label>
        <CoinSearch locale={locale} selected={coin} onSelect={setCoin} />
        {!coin?.id && <p className="text-[10px] text-gray-400 mt-1">{l("selectCoin")}</p>}
      </div>

      {/* Quantity + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {l("quantity")}</label>
          <input name="quantity" type="number" step="any" required value={qty}
            onChange={e => setQty(e.target.value)} onBlur={() => setQtyTouched(true)}
            className={`w-full bg-gray-50 border rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 ${!qtyValid ? "border-red-300" : "border-gray-200"}`}
            placeholder="0.001" />
          {!qtyValid && <p className="text-[10px] text-red-500 mt-0.5">{l("qtyError")}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {l("price")}</label>
          <input name="pricePerUnit" type="number" step="any" required value={price}
            onChange={e => setPrice(e.target.value)} onBlur={() => setPriceTouched(true)}
            className={`w-full bg-gray-50 border rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 ${!priceValid ? "border-red-300" : "border-gray-200"}`}
            placeholder="68000" />
          {!priceValid && <p className="text-[10px] text-red-500 mt-0.5">{l("priceError")}</p>}
        </div>
      </div>

      {/* Fee + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {l("fee")}</label>
          <input name="fee" type="number" step="any" value={fee} onChange={e => setFee(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {l("date")}</label>
          <input name="tradedAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
      </div>

      {/* Total preview */}
      {parseFloat(qty) > 0 && parseFloat(price) > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">{l("total")}</span>
          <span className="text-lg font-bold text-gray-900">${Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {l("notes")}</label>
        <textarea name="notes" rows={2} placeholder={l("notesPlaceholder")}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      <button type="submit" disabled={!coin?.id}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
        {l("record")}
      </button>
    </form>
  );
}
