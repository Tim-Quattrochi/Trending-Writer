"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/supabase/server";

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: signupData, error } = await supabase.auth.signUp(
    data
  );

  if (error) {
    return { message: error.message };
  }

  // Check if the user needs to confirm their email
  if (signupData?.user && signupData.user.identities?.length === 0) {
    return {
      message:
        "This email is already registered. Please log in or reset your password.",
      status: "error",
    };
  }

  // Email confirmation required
  if (signupData?.user && !signupData.user.confirmed_at) {
    return {
      message:
        "Please check your email to confirm your account before logging in.",
      status: "success-pending-confirmation",
    };
  }

  // If no email confirmation needed, redirect to dashboard
  revalidatePath("/", "layout");
  redirect("/");
}
