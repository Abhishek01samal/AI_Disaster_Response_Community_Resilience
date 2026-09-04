"use client";

import { useAuthContext } from "@/context/AuthContext";
import apiInstance from "@/services/auth.api";
import { getErrorMessage } from "@/lib/get-error-message";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isInitialized,
    setIsInitialized,
  } = useAuthContext();

  type RegisterData = {
    name: string;
    email: string;
    password: string;
  };

  type LoginData = {
    email: string;
    password: string;
  };

  const router = useRouter();
  const register = async ({ name, email, password }: RegisterData) => {
    try {
      setIsLoading(true);
      const res = await apiInstance.post("/auth/register", {
        name,
        email,
        password,
      });
      const user = res?.data?.data?.user;
      toast.success(res.data?.message || "Register successfully");
      setUser(user);
      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Register failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async ({ email, password }: LoginData) => {
    try {
      setIsLoading(true);
      const res = await apiInstance.post("/auth/login", {
        email,
        password,
      });
      const user = res?.data?.data?.user;
      toast.success(res.data?.message || "Login successfully");
      setUser(user);

      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const res = await apiInstance.post("/auth/logout");
      toast.success(res.data?.message || "Logout successfully");
      router.push("/");
      // Defer clearing the user state so the Protected component doesn't
      // immediately redirect us to /sign-in before the router can process push("/")
      setTimeout(() => {
        setUser(null);
      }, 0);
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const getUser = async () => {
    try {
      setIsLoading(true);
      const res = await apiInstance.get("/users/profile");
      setUser(res?.data?.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        return;
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const verifyEmail = async () => {
    try {
      const res = await apiInstance.post("/users/verify-email");
      toast.success(res.data?.message || "Verified successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch user data"));
    }
  };

  return {
    user,
    isLoading,
    isInitialized,
    register,
    login,
    logout,
    getUser,
    verifyEmail,
  };
};
