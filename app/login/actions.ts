"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/supabase/server";

interface AuthResult {
  message: string;
  status?: "error" | "success" | "success-pending-confirmation";
}

export async function login(
  prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    return {
      message: "Email and password are required.",
      status: "error",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("Invalid login credentials")) {
      return {
        message: "Invalid email or password. Please try again.",
        status: "error",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        message:
          "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
        status: "error",
      };
    }
    return {
      message: error.message,
      status: "error",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    return {
      message: "Email and password are required.",
      status: "error",
    };
  }

  if (password.length < 6) {
    return {
      message: "Password must be at least 6 characters long.",
      status: "error",
    };
  }

  const { data: signupData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/callback`,
    },
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("already registered")) {
      return {
        message:
          "This email is already registered. Please sign in or reset your password.",
        status: "error",
      };
    }
    if (error.message.includes("valid email")) {
      return {
        message: "Please enter a valid email address.",
        status: "error",
      };
    }
    return {
      message: error.message,
      status: "error",
    };
  }

  // Check if the user already exists (identities array is empty)
  if (signupData?.user && signupData.user.identities?.length === 0) {
    return {
      message:
        "This email is already registered. Please sign in or reset your password.",
      status: "error",
    };
  }

  // Email confirmation required
  if (signupData?.user && !signupData.user.confirmed_at) {
    return {
      message:
        "We've sent you a confirmation email. Please check your inbox and click the link to verify your account.",
      status: "success-pending-confirmation",
    };
  }

  // If no email confirmation needed (rare), redirect to dashboard
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
