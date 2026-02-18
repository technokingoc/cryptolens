"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

type HintKey = "onboardingDashboardTip" | "onboardingProposalsTip" | "onboardingOpportunitiesTip";

export function OnboardingHint({ hintKey, textKey, locale }: { hintKey: string; textKey: HintKey; locale: Locale }) {
  const storageKey = `cl:onboarding:dismissed:${hintKey}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) !== "1";
  });

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-blue-700 font-semibold flex items-center gap-1.5 mb-1"><Lightbulb className="w-3.5 h-3.5" />{t("onboardingTitle", locale)}</p>
        <p className="text-sm text-blue-800">{t(textKey, locale)}</p>
      </div>
      <button onClick={dismiss} className="text-blue-700 hover:text-blue-900 text-xs inline-flex items-center gap-1 shrink-0">
        <X className="w-3.5 h-3.5" />{t("onboardingDismiss", locale)}
      </button>
    </div>
  );
}
