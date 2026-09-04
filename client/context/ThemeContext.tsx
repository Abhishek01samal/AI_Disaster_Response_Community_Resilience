"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useThemeToggle = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeToggle must be used within a ThemeProvider");
  }
  return context;
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Next.js prerenders Client Components to HTML on the server, where
  // `localStorage`/`document` don't exist — but by the time this
  // component hydrates on the client, the anti-flash inline script in
  // the root layout has already run synchronously and set the correct
  // class on <html>. Reading that class back here (via a lazy useState
  // initializer, guarded for the server render) gives the right value
  // on the very first client render with no extra effect/setState pass
  // — avoiding both a flash of the wrong theme and a cascading render.
  const [theme, setTheme] = useState<string>(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system preference changes (optional but good practice).
  // This setState runs inside the event-listener callback (in response
  // to an external change), not synchronously in the effect body, so it
  // doesn't trigger the cascading-render concern the mount-sync version did.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (!localStorage.getItem("theme")) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
