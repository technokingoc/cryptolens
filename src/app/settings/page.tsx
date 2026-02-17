export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg space-y-5">
          <Setting label="Target Long-term Allocation" value="50%" />
          <Setting label="Target Short-term Allocation" value="50%" />
          <Setting label="Base Currency" value="USD" />
          <Setting label="Market Data Source" value="CoinGecko (Free API, 60s cache)" />
          <Setting label="AI Analyst" value="Wen — 7-pillar confluence model" />
          <Setting label="User" value={session.user?.email ?? "—"} />
          <p className="text-gray-300 text-xs pt-2">Configurable settings coming soon.</p>
        </div>
      </main>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}
