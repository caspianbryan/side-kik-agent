import type { Metadata } from "next";
import { ZolaLogo } from "@/components/brand";
import { SetupNotice } from "@/components/setup-notice";
import { SignInForm } from "@/components/sign-in-form";
import { safeNext } from "@/lib/auth";
import { missingSettings } from "@/lib/setup";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

// The conversation the bot actually runs, played once as the page opens.
const SAMPLE: { from: "customer" | "bot"; text: React.ReactNode; time: string }[] = [
  { from: "customer", text: "Habari, nataka KRA PIN", time: "09:41" },
  {
    from: "bot",
    text: (
      <>
        <strong className="font-semibold">KRA PIN (individual)</strong>
        <br />
        Free, about 10 minutes. You need your ID number and an email you can open.
      </>
    ),
    time: "09:41",
  },
  { from: "customer", text: "AGENT", time: "09:42" },
  {
    from: "bot",
    text: (
      <>
        Asante! A person will message you here shortly to help with <strong className="font-semibold">KRA PIN</strong>.
      </>
    ),
    time: "09:42",
  },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const missing = missingSettings();

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section aria-label="Example conversation" className="relative hidden overflow-hidden border-r bg-sidebar lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <ZolaLogo animated />

        <ol className="mx-auto w-full max-w-md space-y-2.5">
          {SAMPLE.map((m, i) => {
            const customer = m.from === "customer";
            return (
              <li
                key={i}
                className={cn("bubble-in flex", customer ? "justify-end" : "justify-start")}
                style={{ animationDelay: `${400 + i * 300}ms` }}
              >
                <p
                  className={cn(
                    "max-w-[85%] rounded-lg px-3.5 py-2 text-[0.9375rem] leading-relaxed",
                    customer ? "rounded-br-sm bg-bubble-out" : "rounded-bl-sm border bg-bubble-in",
                  )}
                >
                  {m.text}
                  <span className="mt-0.5 block text-right text-xs text-muted-foreground">{m.time}</span>
                </p>
              </li>
            );
          })}
        </ol>

        <p className="fade-in font-display max-w-sm text-h2 leading-snug text-foreground/90" style={{ animationDelay: "1700ms" }}>
          Every chat lands in your inbox. Every “AGENT” becomes a lead.
        </p>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <ZolaLogo animated className="mb-12 lg:hidden" />
          <h1 className="font-display text-h1 leading-[1.15]">{missing.length ? "Finish setting up" : "Welcome back"}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {missing.length
              ? "Two minutes in Vercel and you're in."
              : "Sign in with your Zola password to see chats, leads and targets."}
          </p>
          {missing.length ? <SetupNotice missing={missing} /> : <SignInForm next={safeNext(next)} />}
        </div>
      </section>
    </div>
  );
}
