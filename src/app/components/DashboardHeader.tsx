import { LogoutButton } from "./LogoutButton";

export function DashboardHeader() {
  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mission Control</p>
          <h1 className="mt-2 font-monoDisplay text-2xl text-slate-100">Operations Dashboard</h1>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
