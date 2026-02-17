export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user?.name} />
      <main className="flex-1 ml-16 md:ml-56 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target Long-term Allocation</label>
            <p className="text-white text-lg font-semibold">50%</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target Short-term Allocation</label>
            <p className="text-white text-lg font-semibold">50%</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base Currency</label>
            <p className="text-white text-lg font-semibold">USD</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Market Data Source</label>
            <p className="text-white">CoinGecko (Free API, 60s cache)</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">User</label>
            <p className="text-white">{session.user?.email}</p>
          </div>
          <p className="text-gray-600 text-xs mt-4">Settings are currently read-only. Configurable settings coming in P1.</p>
        </div>
      </main>
    </div>
  );
}
