"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { headers } from "next/headers";

export async function signInWithFacebook() {
  const supabase = await createClient();
  const origin = headers().get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.log("Error during Facebook login:", error);
  }

  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
}
