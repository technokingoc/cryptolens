"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "pt" ? "en" : "pt";
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="px-2 py-1 text-xs font-medium rounded-md border border-gray-200 hover:bg-gray-100 transition text-gray-600"
      title={locale === "pt" ? "Switch to English" : "Mudar para Português"}
    >
      {locale === "pt" ? "🇬🇧 EN" : "🇧🇷 PT"}
    </button>
  );
}
