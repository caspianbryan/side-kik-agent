"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { ZolaLogo } from "@/components/brand";
import { Nav } from "@/components/nav";
import { useSidebarCollapsed } from "@/components/sidebar-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/app/auth-actions";
import { cn } from "@/lib/utils";

function Status({ live, collapsed }: { live: boolean; collapsed?: boolean }) {
  const label = live ? "Live: replies go to WhatsApp" : "Demo mode: replies are logged";
  return (
    <p className={cn("flex items-center gap-2 text-xs text-muted-foreground", collapsed && "justify-center")} title={collapsed ? label : undefined}>
      <span aria-hidden className="relative flex size-1.5">
        {live && <span className="live-ping absolute inset-0 rounded-full bg-success" />}
        <span className={cn("relative size-1.5 rounded-full", live ? "bg-success" : "bg-muted-foreground/60")} />
      </span>
      <span className={cn(collapsed && "sr-only")}>{label}</span>
    </p>
  );
}

function SidebarBody({
  live,
  hasPassword,
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  live: boolean;
  hasPassword: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className={cn("flex h-full flex-col py-5", collapsed ? "px-2.5" : "px-3")}>
      <div className={cn("space-y-4 pb-6", collapsed ? "px-0" : "px-3")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between gap-2")}>
          <Link href="/" onClick={onNavigate} aria-label="Zola home" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ZolaLogo collapsed={collapsed} />
          </Link>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
              className="text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
            </Button>
          )}
        </div>
        <Status live={live} collapsed={collapsed} />
      </div>
      <Nav collapsed={collapsed} onNavigate={onNavigate} />
      <div className="mt-auto space-y-0.5 border-t border-sidebar-border pt-3">
        <ThemeToggle collapsed={collapsed} />
        {hasPassword && (
          <form action={signOut}>
            <Button
              variant="ghost"
              type="submit"
              title={collapsed ? "Sign out" : undefined}
              className={cn(
                "w-full gap-3 font-normal text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-start px-3",
              )}
            >
              <LogOutIcon />
              <span className={cn(collapsed && "sr-only")}>Sign out</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Sidebar + main area for every hub page. The sign-in page renders on its own. */
export function AppShell({ live, hasPassword, children }: { live: boolean; hasPassword: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapsed();
  if (path === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside
        data-collapsed={collapsed || undefined}
        className={cn(
          "hidden border-r border-sidebar-border bg-sidebar md:sticky md:top-0 md:block md:h-screen md:shrink-0",
          collapsed ? "md:w-[4.25rem]" : "md:w-60",
        )}
      >
        <SidebarBody live={live} hasPassword={hasPassword} collapsed={collapsed} onToggle={toggle} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-4 backdrop-blur md:hidden">
        <Link href="/" aria-label="Zola home"><ZolaLogo /></Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody live={live} hasPassword={hasPassword} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 flex-1">
        <div key={path.split("/")[1] || "home"} className="page-enter mx-auto w-full max-w-6xl px-4 py-6 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
