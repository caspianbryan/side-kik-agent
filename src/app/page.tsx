import Link from "next/link";
import { ClearDemoButton } from "@/components/clear-demo";
import { PageHeader } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboard } from "@/lib/queries";
import { TARGETS } from "@/lib/targets";
import { initials, kes, phone, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

function daysLeft(iso: string) {
  const end = new Date(`${iso}T23:59:59+03:00`).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function Target({ label, value, goal, hint }: { label: string; value: number; goal: number; hint: string }) {
  const hit = value >= goal;
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        <p className="font-display text-[2.488rem] leading-none">
          {value}
          <span className="ml-1.5 font-sans text-sm text-muted-foreground">of {goal}</span>
        </p>
        <Progress value={Math.min(100, (value / goal) * 100)} aria-label={label} />
        <p className={`text-xs ${hit ? "text-success" : "text-muted-foreground"}`}>{hit ? "Target reached" : hint}</p>
      </CardContent>
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
        lead={`Your first two weeks, measured. Review on 18 November, ${left} day${left === 1 ? "" : "s"} from now.`}
      />

      {d.hasDemo && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-bg px-5 py-3.5 text-sm text-warning-fg">
          <p>These numbers include demo data. Clear it before you go live.</p>
          <ClearDemoButton />
        </div>
      )}

      <section aria-label="Targets" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Target label="Helper chats" value={d.chats} goal={TARGETS.helperChats} hint="People who messaged the number" />
        <Target label="Paid applications" value={d.paidApps} goal={TARGETS.paidApplications} hint="Done-for-you, paid or done" />
        <Target label="Paid SME clients" value={d.paidSme} goal={TARGETS.paidSme} hint="WhatsApp setups, paid or done" />
        <Card className="gap-4 border-primary/35 py-5">
          <CardHeader className="px-5">
            <CardDescription>Earned so far</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <p className="font-display text-[2.488rem] leading-none">
              <span className="mr-1.5 font-sans text-sm text-muted-foreground">KES</span>
              {d.revenueOnce.toLocaleString("en-KE")}
            </p>
            <p className="text-xs text-muted-foreground">
              Plus {kes(d.revenueMonthly)} a month recurring.{" "}
              <Link href="/leads" className="text-primary underline-offset-4 hover:underline">
                {d.openLeads} open lead{d.openLeads === 1 ? "" : "s"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What people ask about</CardTitle>
            <CardDescription>Incoming messages per service</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {d.perService.map((s) => (
                <li key={s.slug} title={`${s.name}: ${s.n} message${s.n === 1 ? "" : "s"}`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="tabular-nums">{s.n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div
                      className="bar-fill h-full rounded-full bg-primary"
                      style={{ width: `${(s.n / max) * 100}%`, minWidth: s.n ? 6 : 0 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Latest messages</CardTitle>
            <CardDescription>Newest first</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/inbox">Open inbox</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.recent.length === 0 ? (
              <div className="rounded-lg border border-dashed px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">No messages yet. See how the bot replies first.</p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/simulator">Open the simulator</Link>
                </Button>
              </div>
            ) : (
              <ul className="-mx-2">
                {d.recent.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/inbox/${m.contactId}`}
                      className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors duration-150 hover:bg-accent"
                    >
                      <Avatar>
                        <AvatarFallback>{initials(m.name, "#")}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.name || phone(m.waId)}</span>
                        <span className="block truncate text-sm text-muted-foreground">{m.body}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(m.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
