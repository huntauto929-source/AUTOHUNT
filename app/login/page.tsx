"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect username or password.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7F6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 360, border: "1px solid #E4E8E6" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0A1930", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Lock size={20} color="#1F9D6C" />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#16232E", margin: "0 0 4px" }}>Auto Hunt POS</h1>
        <p style={{ fontSize: 13, color: "#5B6B70", margin: "0 0 20px" }}>Sign in with your staff account.</p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          autoCapitalize="none"
          style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, border: "1px solid #DCE3E1", padding: "10px 12px", fontSize: 14, marginBottom: 10 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, border: "1px solid #DCE3E1", padding: "10px 12px", fontSize: 14, marginBottom: 12 }}
        />
        {error && <p style={{ color: "#D14343", fontSize: 12, margin: "0 0 12px" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !username || !password}
          style={{
            width: "100%", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: 14, color: "#fff",
            background: "#0A1930", cursor: loading || !username || !password ? "not-allowed" : "pointer",
            opacity: loading || !username || !password ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Checking…</> : "Sign in"}
        </button>
      </form>
    </div>
  );
}
