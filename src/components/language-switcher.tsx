"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher({
  locale,
  iconOnly = false,
  mobile = false,
}: {
  locale: string;
  iconOnly?: boolean;
  mobile?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "pt" ? "en" : "pt";
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  };

  if (iconOnly) {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        className={`inline-flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition ${mobile ? "w-8 h-8" : "w-9 h-9"}`}
        title={locale === "pt" ? "Switch to English" : "Mudar para Português"}
        aria-label={locale === "pt" ? "Switch to English" : "Mudar para Português"}
      >
        <Globe className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition text-gray-600"
      title={locale === "pt" ? "Switch to English" : "Mudar para Português"}
    >
      <Globe className="w-3.5 h-3.5" />
      {locale === "pt" ? "EN" : "PT"}
    </button>
  );
}
