"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny theme store (replaces next-themes, whose injected <script> trips a React 19 warning).
 * The no-flash script runs from the root layout's <head>; this hook reads and changes the choice.
 */
export type ThemeChoice = "dark" | "light" | "system";
const KEY = "theme";
const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (readChoice() === "system") apply("system");
    cb();
  };
  mq.addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onSystem);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readChoice, () => "dark" as ThemeChoice);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "dark",
  );
  const setTheme = useCallback((choice: string) => {
    const c: ThemeChoice = choice === "light" || choice === "system" ? choice : "dark";
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    apply(c);
    listeners.forEach((l) => l());
  }, []);
  return { theme, resolvedTheme, setTheme };
}

/** Inline, runs before paint so the page never flashes the wrong theme. Dark is the default. */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem('${KEY}')||'dark';var d=c==='dark'||(c==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){document.documentElement.classList.add('dark');}})();`;
