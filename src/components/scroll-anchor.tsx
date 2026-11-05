"use client";

import { useEffect, useRef } from "react";

/** Put at the end of a scrolling chat; keeps the newest message in view. Change `token` to re-scroll. */
export function ScrollAnchor({ token }: { token: number }) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, [token]);
  return <li ref={ref} aria-hidden className="h-px" />;
}
