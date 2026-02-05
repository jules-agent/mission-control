import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/auth-options";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
        <div>
          <h1 className="font-monoDisplay text-2xl text-slate-100">Mission Control Access</h1>
          <p className="mt-2 text-sm text-slate-400">
            Authenticate to view live telemetry and mission tasks.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
