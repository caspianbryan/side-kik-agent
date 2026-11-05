"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { signIn, type SignInState } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="mt-10 space-y-6" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "password-error" : undefined}
            className="h-11 pr-11 text-base md:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute top-1.5 right-1.5 text-muted-foreground"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        {state.error && (
          <p id="password-error" role="alert" className="fade-in text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Forgot it? It&apos;s the HUB_PASSWORD setting: in .env.local on your computer, or under Environment Variables in Vercel.
      </p>
    </form>
  );
}
