"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

type Density = "comfortable" | "compact";

const STORAGE_KEY = "cl:display:density";

function getInitialDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  const saved = localStorage.getItem(STORAGE_KEY) as Density | null;
  return saved === "compact" ? "compact" : "comfortable";
}

export function DensityToggle({ locale }: { locale: Locale }) {
  const [density, setDensity] = useState<Density>(getInitialDensity);

  useEffect(() => {
    document.body.dataset.density = density;
  }, [density]);

  const updateDensity = (next: Density) => {
    setDensity(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      <span className="text-[11px] text-gray-400 px-1">{t("density", locale)}</span>
      <button
        onClick={() => updateDensity("comfortable")}
        className={`px-2.5 py-1 text-xs rounded-md transition ${density === "comfortable" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
      >
        {t("comfortable", locale)}
      </button>
      <button
        onClick={() => updateDensity("compact")}
        className={`px-2.5 py-1 text-xs rounded-md transition ${density === "compact" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
      >
        {t("compact", locale)}
      </button>
    </div>
  );
}
