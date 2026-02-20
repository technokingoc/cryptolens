"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";

type Density = "comfortable" | "compact";

const KEY = "cl:display:density";

export function DisplayDensityToggle({ locale }: { locale: Locale }) {
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    return (localStorage.getItem(KEY) as Density | null) ?? "comfortable";
  });

  useEffect(() => {
    document.body.dataset.density = density;
  }, [density]);

  const apply = (next: Density) => {
    setDensity(next);
    localStorage.setItem(KEY, next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => apply("comfortable")}
        className={`px-3 py-1.5 text-xs rounded-lg border ${density === "comfortable" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}
      >
        {t("comfortable", locale)}
      </button>
      <button
        type="button"
        onClick={() => apply("compact")}
        className={`px-3 py-1.5 text-xs rounded-lg border ${density === "compact" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}
      >
        {t("compact", locale)}
      </button>
    </div>
  );
}
