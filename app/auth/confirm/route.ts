import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  const redirectTo = request.nextUrl.clone();

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Successfully verified - redirect to login with success message
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("confirmed", "true");
      redirectTo.searchParams.delete("token_hash");
      redirectTo.searchParams.delete("type");
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  // Error case - redirect to error page or login with error
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "confirmation_failed");
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  return NextResponse.redirect(redirectTo);
}
