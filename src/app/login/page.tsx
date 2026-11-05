import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in · WhatsApp Hub" };

// The conversation the bot actually runs, played once as the page opens.
const SAMPLE: { from: "customer" | "bot"; text: React.ReactNode; time: string }[] = [
  { from: "customer", text: "Habari, nataka KRA PIN", time: "09:41" },
  {
    from: "bot",
    text: (
      <>
        <strong className="font-semibold">KRA PIN (individual)</strong>
        <br />
        Cost: free · about 10 minutes
        <br />
        You need your ID number and an email you can open.
      </>
    ),
    time: "09:41",
  },
  { from: "customer", text: "AGENT", time: "09:42" },
  {
    from: "bot",
    text: (
      <>
        Asante! A person will message you here shortly to help with{" "}
        <strong className="font-semibold">KRA PIN</strong>.
      </>
    ),
    time: "09:42",
  },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section
        aria-label="Example conversation"
        className="hidden flex-col justify-center bg-accent-soft px-10 py-12 md:flex"
      >
        <div className="mx-auto w-full max-w-sm">
          <ol className="space-y-2.5">
            {SAMPLE.map((m, i) => {
              const customer = m.from === "customer";
              return (
                <li
                  key={i}
                  className={`bubble-in flex ${customer ? "justify-end" : "justify-start"}`}
                  style={{ animationDelay: `${150 + i * 300}ms` }}
                >
                  <p
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-[0.9375rem] leading-normal shadow-[0_1px_0_var(--border)] ${
                      customer ? "bg-bubble-out" : "bg-bubble-in"
                    }`}
                  >
                    {m.text}
                    <span className="mt-0.5 block text-right text-xs text-ink-3">{m.time}</span>
                  </p>
                </li>
              );
            })}
          </ol>
          <p
            className="fade-in mt-8 max-w-xs text-sm leading-normal text-ink-2"
            style={{ animationDelay: "1400ms" }}
          >
            Every chat like this lands in your inbox, and every “AGENT” becomes a lead.
          </p>
        </div>
      </section>

      <section className="flex items-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <p className="mb-10 flex items-center gap-2 text-sm font-medium text-ink-2">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent" />
            WhatsApp Hub
          </p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.01em]">Sign in</h1>
          <p className="mt-2 text-base leading-normal text-ink-2">
            Enter the hub password to see chats, leads and targets.
          </p>
          <SignInForm next={safeNext(next)} />
        </div>
      </section>
    </div>
  );
}
