"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm text-slate-300">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
          placeholder="ben@unpluggedperformance.com"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
          placeholder="••••••••••••"
        />
      </label>
      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-status-green px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
