"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ListChecksIcon,
  MessagesSquareIcon,
  PackageIcon,
  Settings2Icon,
  ShoppingBagIcon,
  SmartphoneIcon,
  SquareKanbanIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/inbox", label: "Inbox", icon: MessagesSquareIcon },
  { href: "/orders", label: "Orders", icon: ShoppingBagIcon },
  { href: "/leads", label: "Leads", icon: SquareKanbanIcon },
  { href: "/products", label: "Products", icon: PackageIcon },
  { href: "/checklists", label: "Checklists", icon: ListChecksIcon },
  { href: "/simulator", label: "Simulator", icon: SmartphoneIcon },
  { href: "/settings", label: "Settings", icon: Settings2Icon },
];

export function Nav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-9 items-center gap-3 rounded-md text-sm transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              collapsed ? "justify-center px-0" : "px-3",
              active
                ? "bg-sidebar-accent font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
