import { ENV } from "../lib/env.js";

const baseOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV == "PRODUCTION",
  sameSite:
    ENV.NODE_ENV === "PRODUCTION" ? ("none" as const) : ("lax" as const),
};

const accessTokenOptions = {
  ...baseOptions,
  maxAge: 15 * 60 * 1000,
};

const refreshTokenOptions = {
  ...baseOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export { accessTokenOptions, refreshTokenOptions };
