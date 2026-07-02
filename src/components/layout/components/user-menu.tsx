"use client";

import {
  FolderIcon,
  LogOutIcon,
  RssIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { LogoutFlow } from "@/components/auth/logout-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { authClient, type SessionUser } from "@/lib/auth-client";

interface UserMenuProps {
  user: SessionUser;
}

/**
 * User menu component that displays user info and logout action.
 */
export function UserMenu({ user: initialUser }: UserMenuProps) {
  const { data: session } = authClient.useSession();
  const resetTour = useTourStore((s) => s.reset);

  const user = session?.user ?? initialUser;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

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
              <DropdownMenuItem onSelect={() => resetTour()}>
                <SparklesIcon data-icon="inline-start" />
                Take the tour again
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={handleLogout}
              disabled={isPending}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" aria-hidden={true} />
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
