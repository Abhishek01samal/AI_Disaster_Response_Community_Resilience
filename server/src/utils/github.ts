import * as arctic from "arctic";
import { ENV } from "../lib/env.js";

export const github = new arctic.GitHub(
  ENV.GITHUB_CLIENT_ID,
  ENV.GITHUB_CLIENT_SECRET,
  `${ENV.BACKEND_URL}/auth/github/callback`
);
