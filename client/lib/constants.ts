import {
  Code,
  Database,
  Layers,
  Lock,
  LogIn,
  Mail,
  PenLine,
  Shield,
  User,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "JWT + Refresh Tokens",
    description:
      "Access token (15m) + refresh token (7d) with silent rotation via Axios interceptor. Sessions stay alive without re-login prompts.",
    badge: "Core",
  },
  {
    icon: Database,
    title: "Redis Session Store",
    description:
      "Refresh tokens, active sessions, rate limits, and verification tokens all backed by Redis. Force-logout any session instantly.",
    badge: "Core",
  },
  {
    icon: User,
    title: "Single-Device Sessions",
    description:
      "Session ID embedded in JWT and validated against Redis on every request. New login automatically invalidates all previous sessions.",
    badge: "Security",
  },
  {
    icon: LogIn,
    title: "OAuth — Google & GitHub",
    description:
      "Arctic-powered OAuth with PKCE. Separate OAuthProvider table supports multi-provider linking. State stored in Redis, not cookies.",
    badge: "OAuth",
  },
  {
    icon: Lock,
    title: "Password Flows",
    description:
      "Full forgot / reset via OTP email, change password (authenticated), and OAuth-only account detection. Every edge case handled.",
    badge: "Core",
  },
  {
    icon: Mail,
    title: "Email Verification",
    description:
      "Time-limited tokens via Nodemailer + Gmail OAuth2. Separate flows for registration verification and resend-on-demand.",
    badge: "Core",
  },
  {
    icon: Layers,
    title: "Role-Based Access",
    description:
      "User and Admin roles via Prisma enum. Route-level RBAC middleware — protect any endpoint with a one-line guard.",
    badge: "Core",
  },
  {
    icon: PenLine,
    title: "Zod Validation",
    description:
      "Schema validation on all endpoints — request bodies and environment variables. Crashes early at startup if config is missing.",
    badge: "Quality",
  },
  {
    icon: Code,
    title: "TypeScript End-to-End",
    description:
      "Full type safety across client and server. Typed JWT payloads, typed API responses, typed auth context — no any-typed surprises.",
    badge: "Quality",
  },
];

const stack = [
  "Node.js",
  "TypeScript",
  "Express 5",
  "JWT",
  "Redis",
  "Prisma 7",
  "PostgreSQL",
  "Bcrypt",
  "Arctic",
  "React 19",
  "Next.js",
  "Tailwind CSS 4",
  "shadcn/ui",
  "Zod",
  "Docker",
];

const flows = [
  {
    title: "Email / Password",
    steps: [
      "Register with bcrypt hashed password",
      "Login → sessionId + JWT pair issued",
      "Tokens stored as httpOnly cookies",
      "Logout blacklists refresh token in Redis",
    ],
  },
  {
    title: "Google / GitHub OAuth",
    steps: [
      "PKCE flow via Arctic library",
      "State stored in Redis (5 min TTL)",
      "OAuthProvider row created per provider",
      "Same JWT pair issued — identical session",
    ],
  },
  {
    title: "Token Refresh",
    steps: [
      "Access token expires (15 min)",
      "Axios interceptor catches 401",
      "POST /auth/refresh-token automatically",
      "Original request replayed with new token",
    ],
  },
  {
    title: "Password Reset",
    steps: [
      "Request OTP sent to email",
      "6-digit OTP stored in Redis (10 min)",
      "Verify OTP + submit new password",
      "All active sessions remain valid",
    ],
  },
];

const steps = [
  {
    num: "01",
    title: "Clone the template",
    desc: "One degit command gives you the full auth boilerplate — no git history, no noise.",
  },
  {
    num: "02",
    title: "Configure your env",
    desc: "Fill in your DB URL, Redis URL, JWT secrets, and OAuth credentials in a single .env file.",
  },
  {
    num: "03",
    title: "Build your app",
    desc: "Auth is done. Add your models, routes, and pages on top.",
  },
];

const badgeColors: Record<string, string> = {
  Core: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Security: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  OAuth:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Quality:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const GITHUB_URL = "https://github.com/NJayantRao/Auth-Simplified";

const DEGIT_CMD = "npx degit NJayantRao/Auth-Simplified/auth-pern-stack my-app";

export { features, stack, flows, steps, GITHUB_URL, DEGIT_CMD, badgeColors };
