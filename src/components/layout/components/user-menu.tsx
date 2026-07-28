"use client";

import {
  FolderIcon,
  KeyboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  RssIcon,
  SettingsIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { use } from "react";
import { LogoutFlow } from "@/components/auth/logout-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useKeyboardShortcutsStore } from "@/hooks/ui/use-keyboard-shortcuts-store";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import type { SessionPromise } from "@/types";

/**
 * Dropdown that displays user info, routes, reset tour and logout action.
 */
export function UserMenu({
  sessionPromise,
}: {
  sessionPromise: SessionPromise;
}) {
  const serverSession = use(sessionPromise);
  const { data: clientSession } = authClient.useSession();

  const { setTheme, theme } = useTheme();
  const resetTour = useTourStore((s) => s.reset);
  const setShortcutsOpen = useKeyboardShortcutsStore((s) => s.setOpen);

  const user = clientSession?.user ?? serverSession?.user;

  if (!user) return null;

  const initials = getInitials(user.name);

  return (
    <LogoutFlow isUserAnonymous={user.isAnonymous}>
      {({ handleLogout, isPending }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-opacity hover:opacity-80"
            aria-label="User menu"
          >
            <Avatar className="size-8">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? ""} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-text-primary">
                  {user.name}
                </p>
                <p
                  className="text-xs leading-none text-text-tertiary truncate"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon data-icon="inline-start" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <SettingsIcon data-icon="inline-start" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/manage-categories">
                  <FolderIcon data-icon="inline-start" />
                  Manage Categories
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/manage-feeds">
                  <RssIcon data-icon="inline-start" />
                  Manage Feeds
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
                <KeyboardIcon data-icon="inline-start" />
                Keyboard Shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => resetTour()}>
                <SparklesIcon data-icon="inline-start" />
                Take the tour again
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm">Theme</span>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={setTheme}
                variant="outline"
              >
                <ToggleGroupItem value="light" aria-label="Light theme">
                  <SunIcon className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme">
                  <MoonIcon className="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System theme">
                  <MonitorIcon className="size-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <LogOutIcon data-icon="inline-start" />
              )}
              {isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </LogoutFlow>
  );
}

export function UserMenuSkeleton() {
  return <Skeleton className="size-8 rounded-full animate-pulse" />;
}

export function UserMenuErrorFallback() {
  return (
    <Avatar className="size-8 opacity-50" aria-label="Failed to load user">
      <AvatarFallback className="bg-destructive/10 text-destructive">
        <UserIcon className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
