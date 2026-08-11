"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  type LucideIcon,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CurrentSession } from "@/lib/auth/session";
import { platformNavigation, workspaceNavigation } from "@/lib/service-os/navigation";
import { cn } from "@/lib/utils";

type WorkspaceNavProps = {
  session: CurrentSession;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

function NavItems({
  items,
  pathname,
}: {
  items: readonly NavItem[];
  pathname: string;
}) {
  return (
    <nav className="grid gap-1 px-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/78 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function PlatformLinks({ pathname }: { pathname: string }) {
  return (
    <div className="mt-5">
      <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
        Platform
      </p>
      <NavItems items={platformNavigation} pathname={pathname} />
    </div>
  );
}

function TenantBlock({ session }: WorkspaceNavProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/45 p-3">
        <div className="grid size-10 place-items-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          T
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            Trexiti Service OS
          </p>
          <p className="truncate text-xs text-sidebar-foreground/60">
            Multi-tenant operations
          </p>
        </div>
      </div>
      <button className="mt-3 flex w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar/60 px-3 py-2 text-left">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-sidebar-foreground">
            {session.organization.name}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/60">
            {session.industryTemplate.name}
          </span>
        </span>
        <ChevronDown className="size-4 text-sidebar-foreground/55" />
      </button>
    </div>
  );
}

function Sidebar({ session, pathname }: WorkspaceNavProps & { pathname: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <TenantBlock session={session} />
      <Separator className="bg-sidebar-border" />
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <NavItems items={workspaceNavigation} pathname={pathname} />
        <PlatformLinks pathname={pathname} />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback>{session.user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {session.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNavigation({
  session,
  pathname,
}: WorkspaceNavProps & { pathname: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <TenantBlock session={session} />
        <Separator className="bg-sidebar-border" />
        <div className="py-3">
          <NavItems items={workspaceNavigation} pathname={pathname} />
          <PlatformLinks pathname={pathname} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function WorkspaceNav({ session }: WorkspaceNavProps) {
  const pathname = usePathname();

  return (
    <>
      <Sidebar session={session} pathname={pathname} />
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur lg:pl-72">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <MobileNavigation session={session} pathname={pathname} />
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {session.organization.name}
            </span>
            <Badge variant="outline">{session.organization.status}</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Search">
                  <Search className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search customers, jobs, quotes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Notifications">
                  <Bell className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <div className="hidden items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm sm:flex">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>{session.role}</span>
            </div>
            <Avatar className="size-9">
              <AvatarFallback>{session.user.initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    </>
  );
}
