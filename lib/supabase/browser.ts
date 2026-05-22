import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}
