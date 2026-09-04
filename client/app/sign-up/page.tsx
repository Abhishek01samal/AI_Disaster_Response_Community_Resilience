"use client";

import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
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
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

const SignUp = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { isLoading, register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ name, email, password });
    // console.log("Form submitted with:", { name, email, password });
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
                      Create your account
                    </h1>
                  </div>

                  {/* Name */}
                  <Field>
                    <FieldLabel htmlFor="signup-name">Name</FieldLabel>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      required
                      disabled={isLoading}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
                      }}
                    />
                  </Field>

                  {/* Email */}
                  <Field>
                    <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                    <Input
                      id="signup-email"
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
                    <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="signup-password"
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
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <FieldDescription className="text-xs">
                      Must be at least 8 characters.
                    </FieldDescription>
                  </Field>

                  {/* Submit */}
                  <Field>
                    <Button type="submit" className="w-full">
                      {isLoading ? "Registering..." : "Create Account"}
                    </Button>
                  </Field>

                  {/* Divider */}
                  {/* <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    or continue with
                  </FieldSeparator> */}

                  {/* Socials */}
                  {/* <Field className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 gap-2 font-medium"
                      onClick={() => {
                        window.location.href =
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`;
                      }}
                    >
                      <FcGoogle className="size-4" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 gap-2 font-medium"
                       onClick={() => {
                        window.location.href =
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github`;
                      }}
                    >
                      <FaGithub className="size-4" />
                      GitHub
                    </Button>
                  </Field> */}

                  <FieldDescription className="text-center text-sm">
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
                    >
                      Sign in
                    </Link>
                  </FieldDescription>
                </FieldGroup>
              </form>

              {/* Image panel */}
              <div className="relative hidden bg-muted md:block">
                <img
                  src="/signin-bg.png"
                  alt="Sign up visual"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-8">
                  <p className="text-white text-lg font-semibold leading-snug">
                    Ship auth in minutes.
                    <br />
                    <span className="text-white/70 text-sm font-normal">
                      No vendor lock-in · MIT Licensed
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
