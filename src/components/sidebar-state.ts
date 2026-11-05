"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const KEY = "zola-sidebar";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "collapsed";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Collapsed/expanded sidebar, remembered per browser. Ctrl/Cmd+B toggles it. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? "expanded" : "collapsed");
    } catch {}
    listeners.forEach((l) => l());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { collapsed, toggle };
}
