"use client";

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const THEME_KEY = "edunexus_theme";
const themeEvent = "edunexus-theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const readTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" ? "light" : "dark";
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
};

const subscribeTheme = (callback: () => void) => {
  window.addEventListener(themeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(themeEvent, callback);
    window.removeEventListener("storage", callback);
  };
};

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<ThemeMode>(subscribeTheme, readTheme, () => "dark");

  useEffect(() => {
    applyTheme(readTheme());
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        window.localStorage.setItem(THEME_KEY, nextTheme);
        applyTheme(nextTheme);
        window.dispatchEvent(new Event(themeEvent));
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside Providers");
  }
  return context;
}

