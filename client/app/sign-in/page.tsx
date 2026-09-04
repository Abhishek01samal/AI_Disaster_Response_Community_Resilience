"use client";

import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignIn = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const { isLoading, login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
    // console.log("Form submitted with:", { email, password });
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10 relative">
      <div className="absolute top-4 right-4">
        <AnimatedThemeToggler className="p-2 rounded-full border border-border bg-background shadow-sm hover:bg-muted" />
      </div>
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                <FieldGroup className="gap-5">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Sign in to your Auth System account
                    </p>
                  </div>

                  {/* Email */}
                  <Field>
                    <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEmail(e.target.value);
                      }}
                      onInvalid={(e: React.InvalidEvent<HTMLInputElement>) => {
                        (e.target as HTMLInputElement).setCustomValidity(
                          "Enter Valid E-Mail ID"
                        );
                      }}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        (e.target as HTMLInputElement).setCustomValidity("");
                      }}
                    />
                  </Field>

                  {/* Password */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="signin-password">
                        Password
                      </FieldLabel>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => {
                          router.push("/forgot-password");
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Your Password"
                        value={password}
                        required
                        className="pr-10"
                        disabled={isLoading}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPassword(e.target.value);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </Field>

                  {/* Submit */}
                  <Field>
                    <Button type="submit" className="w-full cursor-pointer">
                      {isLoading ? "Signing in..." : " Sign In"}
                    </Button>
                  </Field>

                  {/* Divider */}
                  {/* <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    or continue with
                  </FieldSeparator> */}

                  {/* Socials — bottom */}
                  {/* <Field className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 gap-2 font-medium"
                      onClick={() => {
                        window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`;
                      }}
                    >
                      <FcGoogle />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 gap-2 font-medium"
                      onClick={() => {
                        window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github`;
                      }}
                    >
                      <FaGithub />
                      GitHub
                    </Button>
                  </Field> */}

                  <FieldDescription className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/sign-up"
                      className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                      Sign up
                    </Link>
                  </FieldDescription>
                </FieldGroup>
              </form>

              {/* Image panel */}
              <div className="relative hidden bg-muted md:block">
                <img
                  src="/signin-bg.png"
                  alt="Sign in visual"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-8">
                  <p className="text-white text-lg font-semibold leading-snug">
                    Secure by design.
                    <br />
                    <span className="text-white/70 text-sm font-normal">
                      JWT · Redis · RBAC
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
