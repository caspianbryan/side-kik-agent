import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ClearDemoButton } from "@/components/clear-demo";
import { getDashboard } from "@/lib/queries";
import { TARGETS } from "@/lib/targets";
import { kes, phone, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

function daysLeft(iso: string) {
  const end = new Date(`${iso}T23:59:59+03:00`).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function Target({ label, value, goal, hint }: { label: string; value: number; goal: number; hint: string }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  const hit = value >= goal;
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-ink-2">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
        <span className="text-base font-normal text-ink-3"> / {goal}</span>
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-3">{hit ? "Target hit ✓" : hint}</p>
    </Card>
  );
}

export default async function Dashboard() {
  const d = await getDashboard();
  const left = daysLeft(TARGETS.review);
  const max = Math.max(1, ...d.perService.map((s) => s.n));

  return (
    <>
      <PageHeader
        title="Dashboard"
        lead={`2-week targets, reviewed on 18 Nov · ${left} day${left === 1 ? "" : "s"} left.`}
      />

      {d.hasDemo && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn-ink">
          <p>These numbers include demo data. Clear it before you go live.</p>
          <ClearDemoButton />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Target label="Helper chats" value={d.chats} goal={TARGETS.helperChats} hint="People who messaged the number" />
        <Target label="Paid applications" value={d.paidApps} goal={TARGETS.paidApplications} hint="Done-for-you, paid or done" />
        <Target label="Paid SME clients" value={d.paidSme} goal={TARGETS.paidSme} hint="WhatsApp setups, paid or done" />
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-2">Revenue so far</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{kes(d.revenueOnce)}</p>
          <p className="mt-3 text-xs text-ink-3">
            + {kes(d.revenueMonthly)}/month recurring ·{" "}
            <Link href="/leads" className="underline underline-offset-2 hover:text-ink">
              {d.openLeads} open lead{d.openLeads === 1 ? "" : "s"}
            </Link>
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">What people ask about</h2>
          <p className="mt-0.5 text-xs text-ink-3">Incoming messages per service</p>
          <ul className="mt-4 space-y-3">
            {d.perService.map((s) => (
              <li key={s.slug} title={`${s.name}: ${s.n} message${s.n === 1 ? "" : "s"}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-2">{s.name}</span>
                  <span className="tabular-nums">{s.n}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(s.n / max) * 100}%`, minWidth: s.n ? 4 : 0 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Latest messages</h2>
            <Link href="/inbox" className="text-xs text-ink-2 underline underline-offset-2 hover:text-ink">
              Open inbox
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-2">
              No messages yet.{" "}
              <Link href="/simulator" className="text-accent underline underline-offset-2">
                Try the simulator
              </Link>{" "}
              to see how the bot replies.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {d.recent.map((m) => (
                <li key={m.id}>
                  <Link href={`/inbox/${m.contactId}`} className="flex items-start justify-between gap-3 py-2.5 hover:text-accent">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{m.name || phone(m.waId)}</span>
                      <span className="block truncate text-sm text-ink-2">{m.body}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-3">{timeAgo(m.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-ink-3">
        Targets live in <Badge>src/lib/targets.ts</Badge>.
      </p>
    </>
  );
}
