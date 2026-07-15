export type DivisionKey = "auto_body" | "towing" | "mechanic" | "auto_hub";
export type TxType = "cash_in" | "cash_out" | "debit_sale";

export interface Transaction {
  id: string;
  division: DivisionKey;
  type: TxType;
  amount: number;
  customer: string;
  description: string;
  points_earned: number;
  created_at: string;
}

export const DIVISIONS: Record<DivisionKey, { label: string; color: string }> = {
  auto_body: { label: "Auto Body", color: "#0A1930" },
  towing: { label: "Towing", color: "#1F6FE8" },
  mechanic: { label: "Mechanic", color: "#1F9D6C" },
  auto_hub: { label: "Auto Hub — Parts & Car Sale", color: "#E8A33D" },
};

export const TX_TYPES: Record<TxType, { label: string; isSale: boolean; sign: 1 | -1; color: string }> = {
  cash_in: { label: "Cash In", isSale: true, sign: 1, color: "#1F9D6C" },
  cash_out: { label: "Cash Out", isSale: false, sign: -1, color: "#D14343" },
  debit_sale: { label: "Debit Sale", isSale: true, sign: 1, color: "#1F6FE8" },
};

export const POINTS_THRESHOLD = 500;
export const pointsForAmount = (amt: number) => Math.floor(amt / 100) * 5;

export function currency(n: number) {
  return (Number(n) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
