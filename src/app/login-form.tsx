"use client";

import { useState, useTransition } from "react";

export default function LoginForm({ signInAction }: { signInAction: (formData: FormData) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await signInAction(formData);
      } catch (e: any) {
        if (e?.message?.includes("CredentialsSignin") || e?.type === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else if (e?.message?.includes("NEXT_REDIRECT") || e?.digest?.includes("NEXT_REDIRECT")) {
          throw e;
        } else {
          setError("Invalid email or password.");
        }
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 mb-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        autoComplete="username"
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Password"
        autoComplete="current-password"
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
      <div className="text-center">
        <a href="/help/account-recovery" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
          Forgot password? / Esqueceu a senha?
        </a>
      </div>
    </form>
  );
}
