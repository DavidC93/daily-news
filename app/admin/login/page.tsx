"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      // Only same-site admin paths, so ?next= can't become an open redirect.
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "שגיאה בהתחברות");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-xs">
        <h1 className="font-headline text-2xl font-600 mb-6 text-center">כניסת ניהול</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          autoFocus
          className="w-full border border-hairline rounded-sm px-3 py-2 mb-3 bg-card text-ink"
        />
        {error && <p className="text-accent text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper rounded-sm px-3 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "כניסה"}
        </button>
      </form>
    </main>
  );
}
