"use client";

import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { GuestDialog } from "@/components/auth/guest-dialog";
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
import { authClient, type User } from "@/lib/auth-client";

interface UserMenuProps {
  user: User;
}

/**
 * User menu component that displays user info and logout action.
 */
export function UserMenu({ user: initialUser }: UserMenuProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);

  const user = session?.user ?? initialUser;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message || "Failed to log out.");
      setIsLoggingOut(false);
    } else {
      toast.success("Logged out successfully.");
      router.push("/sign-in");
    }
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative size-8 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-opacity hover:opacity-80"
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
              <p className="text-xs leading-none text-text-tertiary">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                if (user.isAnonymous) {
                  setIsConversionDialogOpen(true);
                }
              }}
              disabled={!user.isAnonymous}
            >
              <UserIcon data-icon="inline-start" />
              {user.isAnonymous ? "Save progress" : "Profile"}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <SettingsIcon data-icon="inline-start" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            disabled={isLoggingOut}
            className="text-destructive focus:text-destructive focus:bg-destructive-subtle"
          >
            <LogOutIcon data-icon="inline-start" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {user.isAnonymous && (
        <GuestDialog
          open={isConversionDialogOpen}
          onOpenChange={setIsConversionDialogOpen}
        />
      )}
    </>
  );
}
