import { FolderIcon, RssIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

function ManagementMenu({ children }: { children: ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Feeds and Categories
      </SidebarGroupLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="Manage Feeds and Categories">
            <SettingsIcon className="size-4" />
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/manage-feeds">
              <RssIcon data-icon="inline-start" />
              Manage Feeds
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/manage-categories">
              <FolderIcon data-icon="inline-start" />
              Manage Categories
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SidebarGroupContent>{children}</SidebarGroupContent>
    </SidebarGroup>
  );
}

export default ManagementMenu;
