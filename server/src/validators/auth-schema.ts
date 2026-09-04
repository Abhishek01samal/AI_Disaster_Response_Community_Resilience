import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  email: z.string().email({ message: "Invalid Email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid Email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid Email address" }),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid Email address" }),
  otp: z
    .string()
    .min(6, { message: "OTP must be 6 characters long" })
    .max(6, { message: "OTP must be 6 characters long" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});
export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
