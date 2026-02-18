import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account recovery | CryptoLens",
  description:
    "Password recovery guidance for CryptoLens users while self-service reset is not yet available.",
  openGraph: {
    title: "Account recovery | CryptoLens",
    description:
      "Temporary account recovery page for authorized CryptoLens users.",
    type: "website",
  },
};

export default function AccountRecoveryPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <section className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Forgot password / Esqueceu a senha</h1>
        <p className="text-sm text-gray-600 mb-3">
          EN: Self-service password reset is not available yet. Please contact support to recover access.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          PT: A recuperação de palavra-passe por autoatendimento ainda não está disponível. Contacte o suporte para recuperar o acesso.
        </p>

        <a
          href="mailto:anibal.santos.msc@gmail.com?subject=CryptoLens%20-%20Password%20Recovery"
          className="inline-flex items-center justify-center w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Contact support / Contactar suporte
        </a>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            Back to login / Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  );
}
