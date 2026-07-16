import { NextRequest, NextResponse } from "next/server";

function getAccounts() {
  const accounts: { name: string; password: string; role: string }[] = [];
  for (const n of [1, 2, 3]) {
    const name = process.env[`USER${n}_NAME`];
    const password = process.env[`USER${n}_PASSWORD`];
    const role = process.env[`USER${n}_ROLE`] || "staff"; // "owner" or "staff"
    if (name && password) accounts.push({ name, password, role });
  }
  return accounts;
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const accounts = getAccounts();

  if (accounts.length === 0) {
    return NextResponse.json(
      { error: "Server has no accounts configured. Add USER1_NAME / USER1_PASSWORD / USER1_ROLE (and USER2/USER3) in Vercel." },
      { status: 500 }
    );
  }

  const match = accounts.find(
    (a) => a.name.toLowerCase() === String(username || "").trim().toLowerCase() && a.password === password
  );

  if (!match) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: match.name, role: match.role });
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
  res.cookies.set("shop_user", match.name, cookieOpts);
  res.cookies.set("shop_pass", match.password, cookieOpts);
  res.cookies.set("shop_role", match.role, cookieOpts);
  return res;
}
