import dotenv from "dotenv";
import { envSchema } from "../validators/env-schema.js";

dotenv.config({ quiet: true });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables:\n");

  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join(".")} — ${issue.message}`);
  });

  console.error("\nFix the above and restart.\n");
  process.exit(1);
}

const ENV = parsed.data;

export { ENV };
