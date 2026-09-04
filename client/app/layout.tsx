import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Auth-Simplified — Authentication boilerplate for modern apps",
  description:
    "Full-stack auth boilerplate with JWT, Redis sessions, Google & GitHub OAuth, password reset, email verification, and role-based access. Clone and ship.",
};

// Runs before React hydrates so the correct theme class is on <html>
// for the very first paint — otherwise ThemeContext's post-mount sync
// would cause a flash of the wrong theme (this replaces what was
// previously handled implicitly by index.html + main.tsx running
// synchronously on load in the Vite app).
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
