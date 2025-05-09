"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();

      // Sign out the user
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout failed",
        description:
          "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}
