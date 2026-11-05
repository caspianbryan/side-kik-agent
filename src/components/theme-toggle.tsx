"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          title={collapsed ? "Appearance" : undefined}
          className={cn(
            "w-full gap-3 font-normal text-muted-foreground hover:text-foreground",
            collapsed ? "justify-center px-0" : "justify-start px-3",
          )}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
          <span className={cn(collapsed && "sr-only")}>Appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="dark"><MoonIcon /> Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light"><SunIcon /> Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><MonitorIcon /> Match device</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
