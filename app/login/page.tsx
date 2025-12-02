"use client";

import { useState, useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Compass,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { login, signup } from "./actions";
import { signInWithFacebook } from "@/app/auth/actions";

type AuthMode = "login" | "signup";

interface FormState {
  message: string;
  status?: "error" | "success" | "success-pending-confirmation";
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SubmitButton({ mode, pending }: { mode: AuthMode; pending: boolean }) {
  return (
    <Button
      type="submit"
      className="w-full gap-2 bg-primary hover:bg-primary/90"
      disabled={pending}
      size="lg"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {mode === "login" ? "Signing in..." : "Creating account..."}
        </>
      ) : mode === "login" ? (
        "Sign in"
      ) : (
        "Create account"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const [signupState, signupAction, pendingSignup] = useActionState<
    FormState,
    FormData
  >(signup, { message: "" });
  const [loginState, loginAction, pendingLogin] = useActionState<
    FormState,
    FormData
  >(login, { message: "" });

  // Check for URL params (e.g., from email confirmation)
  const confirmed = searchParams.get("confirmed");
  const errorParam = searchParams.get("error");

  const currentState = mode === "login" ? loginState : signupState;
  const isPending = mode === "login" ? pendingLogin : pendingSignup;

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    try {
      await signInWithFacebook();
    } catch (error) {
      setFacebookLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 lg:py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-2xl border bg-card/95 px-4 py-2.5 shadow-sm transition-colors hover:border-primary/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </span>
            <span className="flex flex-col text-left">
              <span className="text-base font-semibold leading-tight">
                Daily Oddities
              </span>
              <span className="text-xs text-muted-foreground">
                Strange signals await
              </span>
            </span>
          </Link>
        </div>

        {/* Success/Error Messages from URL params */}
        {confirmed === "true" && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Email confirmed successfully! You can now sign in.
            </AlertDescription>
          </Alert>
        )}

        {errorParam && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorParam === "access_denied"
                ? "Authentication was cancelled or denied."
                : "Something went wrong. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === "login"
                ? "Sign in to access your Daily Oddities dashboard"
                : "Join the community of curious minds"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Facebook OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 border-[#1877F2]/30 bg-[#1877F2] text-white hover:bg-[#1877F2]/90 hover:text-white"
              size="lg"
              onClick={handleFacebookLogin}
              disabled={facebookLoading || isPending}
            >
              {facebookLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FacebookIcon className="h-5 w-5" />
              )}
              Continue with Facebook
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form action={mode === "login" ? loginAction : signupAction}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                      disabled={isPending}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        mode === "signup" ? "Create a password" : "••••••••"
                      }
                      className="pl-10 pr-10"
                      required
                      disabled={isPending}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "signup" ? 6 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>

                {/* Form State Messages */}
                {currentState?.message && (
                  <Alert
                    className={cn(
                      currentState.status === "success-pending-confirmation"
                        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                        : currentState.status === "success"
                        ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                        : "border-destructive/50 bg-destructive/10 text-destructive"
                    )}
                  >
                    {currentState.status === "success-pending-confirmation" ? (
                      <Mail className="h-4 w-4" />
                    ) : currentState.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{currentState.message}</AlertDescription>
                  </Alert>
                )}

                <SubmitButton mode={mode} pending={isPending} />
              </div>
            </form>

            {/* Mode Toggle */}
            <div className="text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t bg-muted/30 px-6 py-4">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Terms of Service
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Back to home */}
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            ← Back to Daily Oddities
          </Link>
        </p>
      </div>
    </div>
  );
}
