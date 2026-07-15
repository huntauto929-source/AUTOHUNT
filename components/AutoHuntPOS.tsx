"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Wrench, Truck, Car, Store, Plus, X, ChevronLeft, ArrowDownCircle, ArrowUpCircle,
  CreditCard, Sparkles, Award, FileBarChart, Trash2, Camera, Loader2, Users, TrendingUp,
  LayoutGrid, CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import {
  DIVISIONS, TX_TYPES, POINTS_THRESHOLD, pointsForAmount, currency,
  DivisionKey, TxType, Transaction,
} from "@/lib/types";

const DIVISION_ICONS: Record<DivisionKey, any> = { auto_body: Car, towing: Truck, mechanic: Wrench, auto_hub: Store };
const TX_ICONS: Record<TxType, any> = { cash_in: ArrowDownCircle, cash_out: ArrowUpCircle, debit_sale: CreditCard };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Kpi({ label, value, tint, icon: Icon }: { label: string; value: string | number; tint: string; icon?: any }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4E8E6] p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#8A9A9E] uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={14} style={{ color: tint }} />}
      </div>
      <p className="text-xl font-bold text-[#16232E] mt-1 font-mono">{value}</p>
    </div>
  );
}

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: (id: string) => void }) {
  const def = TX_TYPES[tx.type];
  const Icon = TX_ICONS[tx.type];
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E4E8E6] p-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: def.color + "1A" }}>
        <Icon size={16} style={{ color: def.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#16232E] truncate">{tx.description || def.label}</p>
          <p className="font-mono text-sm font-bold shrink-0" style={{ color: def.sign > 0 ? "#1F9D6C" : "#D14343" }}>
            {def.sign > 0 ? "+" : "−"}{currency(tx.amount)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-[#8A9A9E] truncate">
            {def.label}{tx.customer ? ` · ${tx.customer}` : ""} · {fmtDate(tx.created_at)}
          </p>
          {tx.points_earned > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#E8A33D] shrink-0">
              <Award size={11} /> +{tx.points_earned}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(tx.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#FBEAEA] shrink-0">
        <Trash2 size={14} className="text-[#C98080]" />
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[#DCE3E1] px-3 py-2.5 text-sm text-[#16232E] focus:outline-none focus:ring-2 focus:ring-[#1F9D6C]/40 focus:border-[#1F9D6C]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#5B6B70] mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- Add transaction modal ---------------- */
function AddTxModal({
  division, prefill, saving, onClose, onSave,
}: {
  division: DivisionKey; prefill: any; saving: boolean;
  onClose: () => void; onSave: (v: any) => void;
}) {
  const [type, setType] = useState<TxType>(prefill?.type || "cash_in");
  const [amount, setAmount] = useState(prefill?.amount ?? "");
  const [customer, setCustomer] = useState(prefill?.customer || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const amt = Number(amount) || 0;
  const isSale = TX_TYPES[type].isSale;
  const willEarnPoints = isSale && amt >= POINTS_THRESHOLD && customer.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0A1930]/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#EDF1F0]">
          <h2 className="font-bold text-[#16232E] text-lg">New Record — {DIVISIONS[division].label}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F7F6]">
            <X size={18} className="text-[#5B6B70]" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Record type">
            <div className="flex gap-2">
              {(Object.entries(TX_TYPES) as [TxType, typeof TX_TYPES[TxType]][]).map(([key, def]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className="flex-1 rounded-lg py-2.5 text-xs font-semibold border transition-colors"
                  style={type === key ? { backgroundColor: def.color, borderColor: def.color, color: "white" } : { borderColor: "#DCE3E1", color: "#5B6B70" }}
                >
                  {def.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Amount (USD)">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" className={`${inputCls} font-mono`} />
          </Field>
          <Field label={`Customer ${isSale ? "(required for reward points)" : "(optional)"}`}>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Description">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this for?" className={inputCls} />
          </Field>
          {willEarnPoints && (
            <div className="flex items-center gap-2 bg-[#FDF3E2] text-[#8A5D0E] rounded-lg px-3 py-2 text-xs font-semibold">
              <Award size={14} /> This sale qualifies for {pointsForAmount(amt)} reward points.
            </div>
          )}
        </div>
        <div className="p-5 pt-0">
          <button
            disabled={amt <= 0 || saving}
            onClick={() => onSave({ division, type, amount: amt, customer: customer.trim(), description: description.trim() })}
            className="w-full rounded-lg py-3 font-semibold text-white bg-[#0A1930] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#122A52] transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save record"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- AI photo estimate modal ---------------- */
function AiEstimateModal({ onClose, onUseEstimate }: { onClose: () => void; onUseEstimate: (v: any) => void }) {
  const [division, setDivision] = useState<"auto_body" | "mechanic">("auto_body");
  const [notes, setNotes] = useState("");
  const [imgData, setImgData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const full = reader.result as string;
      setImgPreview(full);
      setImgData({ base64: full.split(",")[1], mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = () => setError("Could not read that image — try another file.");
    reader.readAsDataURL(file);
  }

  async function generateEstimate() {
    if (!imgData) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgData.base64, mediaType: imgData.mediaType, division, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Couldn't generate an estimate. Try again or enter the sale manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0A1930]/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#EDF1F0]">
          <h2 className="font-bold text-[#16232E] text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-[#1F9D6C]" /> AI Photo Estimate
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F7F6]">
            <X size={18} className="text-[#5B6B70]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Division">
            <select value={division} onChange={(e) => setDivision(e.target.value as any)} className={inputCls}>
              <option value="auto_body">Auto Body</option>
              <option value="mechanic">Mechanic</option>
            </select>
          </Field>

          <Field label="Vehicle photo">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-[#DCE3E1] py-6 flex flex-col items-center gap-2 hover:border-[#1F9D6C]/50 transition-colors"
            >
              {imgPreview ? (
                <img src={imgPreview} alt="upload preview" className="max-h-40 rounded-lg" />
              ) : (
                <>
                  <Camera size={22} className="text-[#8A9A9E]" />
                  <span className="text-xs text-[#8A9A9E] font-medium">Tap to upload a photo</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </Field>

          <Field label="Notes for the estimate (optional)">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. front-end collision, dented door" className={inputCls} />
          </Field>

          <button
            disabled={!imgData || loading}
            onClick={generateEstimate}
            className="w-full rounded-lg py-3 font-semibold text-white bg-[#1F9D6C] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#188056] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing photo…</> : "Generate estimate"}
          </button>

          {error && <p className="text-xs text-[#D14343] text-center">{error}</p>}

          {result && (
            <div className="bg-[#F5F7F6] rounded-xl p-4 border border-[#E4E8E6] space-y-3">
              <p className="text-sm text-[#16232E]">{result.summary}</p>
              <div className="space-y-1.5">
                {(result.lineItems || []).map((li: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#5B6B70]">{li.item}</span>
                    <span className="font-mono text-[#16232E]">{currency(li.cost)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#DCE3E1] pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8A9A9E] uppercase">Estimated range</span>
                <span className="font-mono font-bold text-[#16232E]">{currency(result.estimateLow)} – {currency(result.estimateHigh)}</span>
              </div>
              <p className="text-[11px] text-[#8A9A9E]">AI-generated preliminary estimate — confirm before invoicing the customer.</p>
              <button
                onClick={() =>
                  onUseEstimate({
                    division,
                    amount: Math.round(((result.estimateLow || 0) + (result.estimateHigh || 0)) / 2),
                    description: result.summary?.slice(0, 80) || "AI photo estimate",
                  })
                }
                className="w-full rounded-lg py-2.5 font-semibold text-white bg-[#0A1930] hover:bg-[#122A52] transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} /> Turn into a sale record
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Division view ---------------- */
function DivisionView({
  division, txs, onBack, onAdd, onDelete,
}: {
  division: DivisionKey; txs: Transaction[]; onBack: () => void; onAdd: () => void; onDelete: (id: string) => void;
}) {
  const Icon = DIVISION_ICONS[division];
  const def = DIVISIONS[division];
  const totals = useMemo(() => {
    const t = { cash_in: 0, cash_out: 0, debit_sale: 0 };
    txs.forEach((tx) => (t[tx.type] += tx.amount));
    return t;
  }, [txs]);
  const net = totals.cash_in + totals.debit_sale - totals.cash_out;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 px-4 pt-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F7F6]">
          <ChevronLeft size={20} className="text-[#5B6B70]" />
        </button>
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: def.color }} />
          <h1 className="font-bold text-[#16232E]">{def.label}</h1>
        </div>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <Kpi label="Cash In" value={currency(totals.cash_in)} tint="#1F9D6C" />
        <Kpi label="Debit Sale" value={currency(totals.debit_sale)} tint="#1F6FE8" />
        <Kpi label="Cash Out" value={currency(totals.cash_out)} tint="#D14343" />
        <Kpi label="Net" value={currency(net)} tint="#0A1930" />
      </div>

      <div className="px-4 mt-5 flex items-center justify-between">
        <h2 className="font-bold text-sm text-[#16232E]">Records</h2>
        <span className="text-xs text-[#8A9A9E]">{txs.length} entries</span>
      </div>
      <div className="px-4 mt-2 space-y-2">
        {txs.length === 0 && <p className="text-sm text-[#8A9A9E] text-center py-8">No records yet. Add the first one.</p>}
        {[...txs].reverse().map((tx) => <TxRow key={tx.id} tx={tx} onDelete={onDelete} />)}
      </div>

      <button
        onClick={onAdd}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        style={{ backgroundColor: def.color }}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

/* ---------------- Reports view ---------------- */
function ReportsView({ txs, date, setDate, onBack }: { txs: Transaction[]; date: string; setDate: (d: string) => void; onBack: () => void }) {
  const dayTx = useMemo(() => txs.filter((t) => t.created_at.slice(0, 10) === date), [txs, date]);

  const perDivision = useMemo(() => {
    return (Object.keys(DIVISIONS) as DivisionKey[]).map((key) => {
      const t = dayTx.filter((tx) => tx.division === key);
      const cashIn = t.filter((tx) => tx.type === "cash_in").reduce((a, b) => a + b.amount, 0);
      const cashOut = t.filter((tx) => tx.type === "cash_out").reduce((a, b) => a + b.amount, 0);
      const debit = t.filter((tx) => tx.type === "debit_sale").reduce((a, b) => a + b.amount, 0);
      const revenue = cashIn + debit;
      return { key, label: DIVISIONS[key].label, cashIn, cashOut, debit, revenue, net: revenue - cashOut, count: t.length };
    });
  }, [dayTx]);

  const grand = perDivision.reduce(
    (a, d) => ({ cashIn: a.cashIn + d.cashIn, cashOut: a.cashOut + d.cashOut, debit: a.debit + d.debit, revenue: a.revenue + d.revenue, net: a.net + d.net, count: a.count + d.count }),
    { cashIn: 0, cashOut: 0, debit: 0, revenue: 0, net: 0, count: 0 }
  );

  const pointsIssued = dayTx.reduce((a, t) => a + (t.points_earned || 0), 0);
  const chartData = perDivision.map((d) => ({ name: d.label.split(" ")[0], revenue: d.revenue }));

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 px-4 pt-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F7F6]">
          <ChevronLeft size={20} className="text-[#5B6B70]" />
        </button>
        <h1 className="font-bold text-[#16232E] flex items-center gap-2"><FileBarChart size={17} className="text-[#1F9D6C]" /> Daily Report</h1>
      </div>

      <div className="px-4 mt-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Kpi label="Total Revenue" value={currency(grand.revenue)} tint="#1F9D6C" icon={TrendingUp} />
        <Kpi label="Cash Out" value={currency(grand.cashOut)} tint="#D14343" />
        <Kpi label="Net Cash" value={currency(grand.net)} tint="#0A1930" />
        <Kpi label="Points Issued" value={pointsIssued} tint="#E8A33D" icon={Award} />
      </div>

      <div className="px-4 mt-5">
        <h2 className="font-bold text-sm text-[#16232E] mb-2">Revenue by division</h2>
        <div className="bg-white rounded-xl border border-[#E4E8E6] p-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A9A9E" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8A9A9E" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v: any) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#1F9D6C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-2">
        <h2 className="font-bold text-sm text-[#16232E]">By division</h2>
        {perDivision.map((d) => {
          const Icon = DIVISION_ICONS[d.key];
          return (
            <div key={d.key} className="bg-white rounded-xl border border-[#E4E8E6] p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#16232E]">
                  <Icon size={15} style={{ color: DIVISIONS[d.key].color }} /> {d.label}
                </span>
                <span className="text-xs text-[#8A9A9E]">{d.count} records</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                <div><p className="text-[10px] text-[#8A9A9E] uppercase">Cash In</p><p className="font-mono text-xs font-semibold text-[#1F9D6C]">{currency(d.cashIn)}</p></div>
                <div><p className="text-[10px] text-[#8A9A9E] uppercase">Debit</p><p className="font-mono text-xs font-semibold text-[#1F6FE8]">{currency(d.debit)}</p></div>
                <div><p className="text-[10px] text-[#8A9A9E] uppercase">Cash Out</p><p className="font-mono text-xs font-semibold text-[#D14343]">{currency(d.cashOut)}</p></div>
                <div><p className="text-[10px] text-[#8A9A9E] uppercase">Net</p><p className="font-mono text-xs font-semibold text-[#16232E]">{currency(d.net)}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Rewards view ---------------- */
function RewardsView({ txs, onBack }: { txs: Transaction[]; onBack: () => void }) {
  const rewards = useMemo(() => {
    const map: Record<string, { name: string; points: number; spent: number; visits: number }> = {};
    txs.forEach((t) => {
      const def = TX_TYPES[t.type];
      if (def.isSale && t.amount >= POINTS_THRESHOLD && t.customer?.trim()) {
        const key = t.customer.trim().toLowerCase();
        if (!map[key]) map[key] = { name: t.customer.trim(), points: 0, spent: 0, visits: 0 };
        map[key].points += t.points_earned || pointsForAmount(t.amount);
        map[key].spent += t.amount;
        map[key].visits += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.points - a.points);
  }, [txs]);

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 px-4 pt-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F7F6]">
          <ChevronLeft size={20} className="text-[#5B6B70]" />
        </button>
        <h1 className="font-bold text-[#16232E] flex items-center gap-2"><Award size={17} className="text-[#E8A33D]" /> Reward Points</h1>
      </div>
      <p className="px-4 mt-2 text-xs text-[#8A9A9E]">Customers earn 5 points per $100 on any sale of {currency(POINTS_THRESHOLD)} or more.</p>
      <div className="px-4 mt-4 space-y-2">
        {rewards.length === 0 && <p className="text-sm text-[#8A9A9E] text-center py-8">No reward customers yet.</p>}
        {rewards.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E4E8E6] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#16232E]">{r.name}</p>
              <p className="text-xs text-[#8A9A9E]">{r.visits} qualifying sale{r.visits !== 1 ? "s" : ""} · {currency(r.spent)} spent</p>
            </div>
            <p className="font-mono font-bold text-[#E8A33D]">{r.points} pts</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Root component ---------------- */
export default function AutoHuntPOS() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState<"home" | "division" | "reports" | "rewards">("home");
  const [activeDivision, setActiveDivision] = useState<DivisionKey | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPrefill, setAddPrefill] = useState<any>(null);
  const [showAi, setShowAi] = useState(false);
  const [reportDate, setReportDate] = useState(todayISO());

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: true });
    if (error) {
      setLoadError(error.message + " — check your .env.local Supabase values and that schema.sql has been run.");
    } else {
      setTxs((data || []) as Transaction[]);
    }
    setLoading(false);
  }

  const todayTx = useMemo(() => txs.filter((t) => t.created_at.slice(0, 10) === todayISO()), [txs]);
  const todayTotals = useMemo(() => {
    const revenue = todayTx.filter((t) => TX_TYPES[t.type].isSale).reduce((a, t) => a + t.amount, 0);
    const cashOut = todayTx.filter((t) => t.type === "cash_out").reduce((a, t) => a + t.amount, 0);
    const points = todayTx.reduce((a, t) => a + (t.points_earned || 0), 0);
    return { revenue, cashOut, points, active: todayTx.length };
  }, [todayTx]);

  function divisionRevenue(key: DivisionKey) {
    return txs.filter((t) => t.division === key && TX_TYPES[t.type].isSale).reduce((a, t) => a + t.amount, 0);
  }

  async function saveTx({ division, type, amount, customer, description }: any) {
    setSaving(true);
    let points_earned = 0;
    if (TX_TYPES[type as TxType].isSale && amount >= POINTS_THRESHOLD && customer) {
      points_earned = pointsForAmount(amount);
    }
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ division, type, amount, customer, description, points_earned }])
      .select()
      .single();

    setSaving(false);
    if (error) {
      alert("Couldn't save that record: " + error.message);
      return;
    }
    setTxs((prev) => [...prev, data as Transaction]);
    setShowAddModal(false);
    setAddPrefill(null);
    if (!activeDivision) {
      setActiveDivision(division);
      setView("division");
    }
  }

  async function deleteTx(id: string) {
    const prev = txs;
    setTxs((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      alert("Couldn't delete that record: " + error.message);
      setTxs(prev);
    }
  }

  function openDivision(key: DivisionKey) {
    setActiveDivision(key);
    setView("division");
  }

  return (
    <div className="min-h-screen bg-[#F5F7F6]">
      <div className="bg-[#0A1930] text-white px-4 pt-5 pb-6 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1F9D6C] flex items-center justify-center">
              <LayoutGrid size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight">Auto Hunt <span className="text-[#1F9D6C]">POS</span></span>
          </div>
          {view !== "home" && (
            <button onClick={() => setView("home")} className="text-xs font-semibold text-white/70 hover:text-white">Home</button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto -mt-3">
        {loadError && (
          <div className="mx-4 mt-3 bg-[#FBEAEA] text-[#8A2E2E] text-xs rounded-lg p-3">
            {loadError}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-[#1F9D6C]" />
          </div>
        ) : (
          <>
            {view === "home" && (
              <div className="px-4 pb-24">
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Kpi label="Today's Revenue" value={currency(todayTotals.revenue)} tint="#1F9D6C" />
                  <Kpi label="Cash Out" value={currency(todayTotals.cashOut)} tint="#D14343" />
                  <Kpi label="Points Issued" value={todayTotals.points} tint="#E8A33D" icon={Award} />
                  <Kpi label="Records Today" value={todayTotals.active} tint="#0A1930" />
                </div>

                <h2 className="font-bold text-[#16232E] mt-6 mb-2">Divisions</h2>
                <div className="space-y-2.5">
                  {(Object.keys(DIVISIONS) as DivisionKey[]).map((key) => {
                    const def = DIVISIONS[key];
                    const Icon = DIVISION_ICONS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => openDivision(key)}
                        className="w-full bg-white rounded-xl border border-[#E4E8E6] p-4 flex items-center justify-between hover:border-[#1F9D6C]/40 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: def.color + "1A" }}>
                            <Icon size={18} style={{ color: def.color }} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-[#16232E] text-sm">{def.label}</p>
                            <p className="text-xs text-[#8A9A9E]">All-time revenue: {currency(divisionRevenue(key))}</p>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="rotate-180 text-[#8A9A9E]" />
                      </button>
                    );
                  })}
                </div>

                <h2 className="font-bold text-[#16232E] mt-6 mb-2">Tools</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowAi(true)} className="bg-[#1F9D6C] text-white rounded-xl p-4 flex flex-col items-start gap-2 hover:bg-[#188056] transition-colors">
                    <Sparkles size={18} />
                    <span className="text-sm font-semibold text-left">AI Photo Estimate</span>
                  </button>
                  <button onClick={() => setView("reports")} className="bg-white border border-[#E4E8E6] rounded-xl p-4 flex flex-col items-start gap-2 hover:border-[#1F9D6C]/40 transition-colors">
                    <FileBarChart size={18} className="text-[#0A1930]" />
                    <span className="text-sm font-semibold text-left text-[#16232E]">Daily Report</span>
                  </button>
                  <button onClick={() => setView("rewards")} className="bg-white border border-[#E4E8E6] rounded-xl p-4 flex flex-col items-start gap-2 hover:border-[#1F9D6C]/40 transition-colors col-span-2">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-[#E8A33D]" />
                      <span className="text-sm font-semibold text-[#16232E]">Reward Members</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {view === "division" && activeDivision && (
              <DivisionView
                division={activeDivision}
                txs={txs.filter((t) => t.division === activeDivision)}
                onBack={() => setView("home")}
                onAdd={() => { setAddPrefill(null); setShowAddModal(true); }}
                onDelete={deleteTx}
              />
            )}

            {view === "reports" && <ReportsView txs={txs} date={reportDate} setDate={setReportDate} onBack={() => setView("home")} />}

            {view === "rewards" && <RewardsView txs={txs} onBack={() => setView("home")} />}
          </>
        )}
      </div>

      {showAddModal && (
        <AddTxModal
          division={activeDivision || addPrefill?.division || "auto_body"}
          prefill={addPrefill}
          saving={saving}
          onClose={() => { setShowAddModal(false); setAddPrefill(null); }}
          onSave={saveTx}
        />
      )}

      {showAi && (
        <AiEstimateModal
          onClose={() => setShowAi(false)}
          onUseEstimate={(pref: any) => {
            setShowAi(false);
            setActiveDivision(pref.division);
            setAddPrefill({ division: pref.division, type: "debit_sale", amount: pref.amount, description: pref.description, customer: "" });
            setShowAddModal(true);
          }}
        />
      )}
    </div>
  );
}
