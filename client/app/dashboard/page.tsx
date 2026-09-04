"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  DollarSign,
  Users,
  Activity,
  Hexagon,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  Search,
} from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import apiInstance from "@/services/auth.api";
import { getErrorMessage } from "@/lib/get-error-message";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, logout, isLoading, verifyEmail } = useAuth();
  // const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    try {
      setIsChangingPass(true);
      const res = await apiInstance.patch("/users/change-password", {
        oldPassword,
        newPassword,
      });
      toast.success(res.data?.message || "Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to change password"));
    } finally {
      setIsChangingPass(false);
    }
  };
  //logout
  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    logout();
  };

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    await verifyEmail();
    setIsVerifying(false);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background md:bg-muted/30">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 flex-col border-r border-border bg-background md:flex sticky top-0 h-screen">
        <div className="flex h-16 items-center px-6 border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Hexagon className="size-6 text-foreground" />
            <span className="text-lg">AuthSystem</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground transition-colors"
          >
            <LayoutDashboard className="size-4" />
            Overview
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <ShoppingCart className="size-4" />
            Orders
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Package className="size-4" />
            Products
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Users className="size-4" />
            Customers
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-background md:rounded-tl-2xl md:border-l md:border-t md:border-border overflow-hidden md:mt-2 md:shadow-sm">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 lg:px-8 shrink-0">
          <div className="flex flex-1 items-center gap-2 md:hidden">
            <Hexagon className="size-6 text-foreground shrink-0" />
            <h1 className="text-lg font-semibold tracking-tight truncate">
              AuthSystem
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 top-[10px] h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-9 w-[150px] rounded-md bg-muted/40 pl-9 md:w-[200px] lg:w-[250px]"
              />
            </div>

            <AnimatedThemeToggler className="p-2 rounded-full hover:bg-muted/40" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full overflow-hidden border border-border bg-muted/40"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@user" />
                    <AvatarFallback className="bg-background text-xs font-semibold">
                      {user?.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel>
                  <span className="font-normal block text-xs text-muted-foreground">
                    Signed in as
                  </span>
                  <span className="truncate block font-medium max-w-[200px]">
                    {user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Global loading state for center space */}
        {!user && isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-background">
            <Spinner
              size="xl"
              showText
              text="Loading secure interface..."
              className="scale-125"
            />
          </div>
        ) : (
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <Tabs
              defaultValue="overview"
              className="space-y-6 max-w-6xl mx-auto"
            >
              <TabsList className="bg-muted/40 flex-wrap h-auto justify-start w-full md:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="security">Security & Account</TabsTrigger>
                <TabsTrigger value="api" disabled>
                  API Keys
                </TabsTrigger>
              </TabsList>

              {/* ── Overview Tab (Dummy content) ── */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$45,231.89</div>
                      <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Subscriptions
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+2,350</div>
                      <p className="text-xs text-muted-foreground">
                        +180.1% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Sales
                      </CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+12,234</div>
                      <p className="text-xs text-muted-foreground">
                        +19% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Now
                      </CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+573</div>
                      <p className="text-xs text-muted-foreground">
                        +201 since last hour
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="md:col-span-2 lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Overview Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <div className="flex h-[350px] items-end gap-2 p-4">
                        {[30, 20, 50, 40, 80, 60, 40, 90, 70, 50, 80, 60].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="w-full bg-foreground/90 rounded-t-sm hover:opacity-80 transition-opacity"
                              style={{ height: `${h}%` }}
                            />
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Sales</CardTitle>
                      <CardDescription>
                        You made 265 sales this month.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {[
                          {
                            name: "Olivia Martin",
                            email: "olivia.martin@email.com",
                            amount: "+$1,999.00",
                          },
                          {
                            name: "Jackson Lee",
                            email: "jackson.lee@email.com",
                            amount: "+$39.00",
                          },
                          {
                            name: "Isabella Nguyen",
                            email: "isabella.nguyen@email.com",
                            amount: "+$299.00",
                          },
                          {
                            name: "William Kim",
                            email: "will@email.com",
                            amount: "+$99.00",
                          },
                          {
                            name: "Sofia Davis",
                            email: "sofia.davis@email.com",
                            amount: "+$39.00",
                          },
                        ].map((sale, i) => (
                          <div key={i} className="flex items-center">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {sale.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {sale.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {sale.email}
                              </p>
                            </div>
                            <div className="ml-auto font-medium">
                              {sale.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Security & Account Tab (Dynamic Content) ── */}
              <TabsContent value="security" className="space-y-6">
                <div className="grid gap-6 max-w-3xl">
                  {/* Email Verification Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Settings</CardTitle>
                      <CardDescription>
                        Manage your email address and verification status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full flex shrink-0 ${user?.isVerified ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"}`}
                          >
                            {user?.isVerified ? (
                              <CheckCircle2 className="size-5" />
                            ) : (
                              <AlertCircle className="size-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user?.email}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {user?.isVerified
                                ? "Your email address is verified."
                                : "Your email address is pending verification."}
                            </p>
                          </div>
                        </div>
                        {!user?.isVerified && (
                          <Button
                            variant="secondary"
                            onClick={handleVerifyEmail}
                            disabled={isVerifying}
                          >
                            {isVerifying ? (
                              <Spinner
                                size="sm"
                                variant="button"
                                className="mr-2"
                              />
                            ) : null}
                            Verify Email
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Change Password Section */}

                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password associated with your account.
                      </CardDescription>
                    </CardHeader>
                    <form
                      onSubmit={(e: React.FormEvent) => {
                        handleChangePassword(e);
                      }}
                    >
                      <CardContent className="space-y-4">
                        <FieldGroup className="gap-5">
                          <Field>
                            <FieldLabel htmlFor="current-password">
                              Current Password
                            </FieldLabel>
                            <Input
                              id="current-password"
                              type="password"
                              placeholder="Enter current password"
                              value={oldPassword}
                              required
                              className="max-w-md"
                              onChange={(e) => {
                                setOldPassword(e.target.value);
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="new-password">
                              New Password
                            </FieldLabel>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Enter new password"
                              value={newPassword}
                              required
                              className="max-w-md"
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="confirm-password">
                              Confirm Password
                            </FieldLabel>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              required
                              className="max-w-md"
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                              }}
                            />
                          </Field>
                        </FieldGroup>
                      </CardContent>
                      <CardFooter className="border-t px-6 py-4 bg-muted/40 mt-4 rounded-b-lg">
                        <Button type="submit" disabled={isChangingPass}>
                          {isChangingPass ? (
                            <Spinner
                              size="sm"
                              variant="button"
                              className="mr-2"
                            />
                          ) : null}
                          Update Password
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
