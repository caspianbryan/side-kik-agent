"use client";

import { useActionState, useState } from "react";
import { signIn, type SignInState } from "@/app/auth-actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="mt-8" noValidate>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
        Hub password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
          className={`h-11 w-full rounded-md border bg-surface pl-3 pr-16 text-base text-ink transition-colors duration-150 focus:outline-none ${
            state.error ? "border-danger" : "border-line focus:border-accent"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          className="absolute inset-y-1 right-1 rounded px-2.5 text-sm text-ink-2 hover:text-ink"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {state.error && (
        <p id="password-error" role="alert" className="fade-in mt-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 h-11 w-full rounded-md bg-accent text-base font-medium text-accent-ink transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-6 text-xs leading-snug text-ink-3">
        Forgot it? The password is HUB_PASSWORD in your .env.local file.
      </p>
    </form>
  );
}
