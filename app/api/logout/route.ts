import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("shop_user", "", { path: "/", maxAge: 0 });
  res.cookies.set("shop_pass", "", { path: "/", maxAge: 0 });
  res.cookies.set("shop_role", "", { path: "/", maxAge: 0 });
  return res;
}
