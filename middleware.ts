import { NextRequest, NextResponse } from "next/server";

function getAccounts() {
  const accounts: { name: string; password: string; role: string }[] = [];
  for (const n of [1, 2, 3]) {
    const name = process.env[`USER${n}_NAME`];
    const password = process.env[`USER${n}_PASSWORD`];
    const role = process.env[`USER${n}_ROLE`] || "staff";
    if (name && password) accounts.push({ name, password, role });
  }
  return accounts;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  const user = req.cookies.get("shop_user")?.value;
  const pass = req.cookies.get("shop_pass")?.value;
  const role = req.cookies.get("shop_role")?.value;
  const accounts = getAccounts();

  const valid = accounts.some((a) => a.name === user && a.password === pass && a.role === role);

  if (!valid) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
