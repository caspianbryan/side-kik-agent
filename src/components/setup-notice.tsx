const HELP: Record<string, { what: string; example: string }> = {
  HUB_PASSWORD: { what: "The password you'll sign in with.", example: "a long phrase only you know" },
  DATABASE_URL: { what: "Your Neon connection string.", example: "postgresql://…neon.tech/neondb?sslmode=require" },
};

/** Shown on the sign-in page when a deployment is missing required settings. */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-lg bg-warning-bg px-4 py-3 text-sm leading-relaxed text-warning-fg">
        Zola is deployed but can&apos;t open yet: {missing.length === 1 ? "one setting is" : "some settings are"} missing.
      </div>
      <ol className="space-y-5 text-sm">
        <li className="flex gap-3">
          <span className="font-display flex size-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">1</span>
          <div className="min-w-0 space-y-3">
            <p>In Vercel, open your project, then <span className="font-medium">Settings</span> and <span className="font-medium">Environment Variables</span>, and add:</p>
            <ul className="space-y-2">
              {missing.map((name) => (
                <li key={name} className="rounded-md border bg-card px-3 py-2.5">
                  <code className="font-mono text-[0.8125rem] text-primary">{name}</code>
                  <p className="mt-1 text-muted-foreground">{HELP[name]?.what}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">e.g. {HELP[name]?.example}</p>
                </li>
              ))}
            </ul>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-display flex size-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">2</span>
          <p>
            Open <span className="font-medium">Deployments</span>, pick the latest one and choose <span className="font-medium">Redeploy</span>. New settings only apply to new deployments.
          </p>
        </li>
      </ol>
    </div>
  );
}
