import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.cookies.get("shop_user")?.value || null;
  const role = req.cookies.get("shop_role")?.value || null;
  return NextResponse.json({ name, role });
}
