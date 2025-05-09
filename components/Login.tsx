"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { login, signup } from "@/app/login/actions";
import { signInWithFacebook } from "@/app/auth/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginState, loginAction] = useFormState(login, {
    message: null,
  });
  const [signupState, signupAction] = useFormState(signup, {
    message: null,
    status: null,
  });

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Use the server action for Facebook login
      await signInWithFacebook();
    } catch (error) {
      console.error("Error during Facebook login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Trending Writer</CardTitle>
          <CardDescription>
            Sign in to access your account or create a new one
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <CardContent className="space-y-4 pt-4">
              {loginState?.message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {loginState.message}
                  </AlertDescription>
                </Alert>
              )}
              <form action={loginAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleFacebookLogin}
                disabled={isLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardContent className="space-y-4 pt-4">
              {signupState?.message && (
                <Alert
                  variant={
                    signupState.status === "error"
                      ? "destructive"
                      : "default"
                  }
                >
                  {signupState.status === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {signupState.status === "error"
                      ? "Error"
                      : "Check your email"}
                  </AlertTitle>
                  <AlertDescription>
                    {signupState.message}
                  </AlertDescription>
                </Alert>
              )}
              <form action={signupAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter>
          <p className="text-xs text-center w-full text-muted-foreground">
            By continuing, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
