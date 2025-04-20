"use client";

// WIP not complete.

import { createClient } from "@/supabase/client";

export default function Login() {
  const handleFacebookLogin = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // The URL to redirect to after login
      },
    });

    if (error) {
      console.error("Error during Facebook login:", error);
    } else {
      console.log("Successfully initiated login flow");
    }
  };

  return (
    <div>
      <button onClick={handleFacebookLogin}>
        Login with Facebook
      </button>
    </div>
  );
}
