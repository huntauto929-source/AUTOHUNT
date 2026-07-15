import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // This only throws at runtime in the browser/server when actually used,
  // so the app still builds without env vars set.
  console.warn(
    "Supabase env vars are missing. Copy .env.local.example to .env.local and fill in your project values."
  );
}

export const supabase = createClient(url, anonKey);
