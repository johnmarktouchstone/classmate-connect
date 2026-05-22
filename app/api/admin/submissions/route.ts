import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isPostStatus } from "@/lib/submissions";

export async function GET(request: Request) {
  const unauthorizedResponse = assertAdminRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "all";
  const supabase = createServiceSupabaseClient();

  let query = supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    if (!isPostStatus(status)) {
      return NextResponse.json({ error: "Unknown status filter." }, { status: 400 });
    }

    query = query.eq("post_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data ?? [] });
}
