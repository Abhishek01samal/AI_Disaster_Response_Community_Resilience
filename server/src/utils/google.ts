import * as arctic from "arctic";
import { ENV } from "../lib/env.js";

export const google = new arctic.Google(
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  `${ENV.BACKEND_URL}/auth/google/callback`
);
