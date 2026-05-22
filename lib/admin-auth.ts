import { NextResponse } from "next/server";

export function assertAdminRequest(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const providedPassword = request.headers.get("x-admin-password");

  if (!providedPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
