import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "resq-app",
  env: process.env.NODE_ENV === "PRODUCTION" ? "production" : "development",
});
