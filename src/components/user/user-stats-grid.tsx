import { Bookmark, BookOpen, Folder, Rss } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStatsGridProps {
  stats: {
    subscriptions: number;
    categories: number;
    readArticles: number;
    bookmarkedArticles: number;
  };
}

export function UserStatsGrid({ stats }: UserStatsGridProps) {
  const items = [
    {
      title: "Subscriptions",
      value: stats.subscriptions,
      icon: Rss,
      description: "Active feed subscriptions",
      colorClass:
        "text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10",
    },
    {
      title: "Categories",
      value: stats.categories,
      icon: Folder,
      description: "Custom organization folders",
      colorClass:
        "text-purple-500 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-400/10",
    },
    {
      title: "Read Articles",
      value: stats.readArticles,
      icon: BookOpen,
      description: "Articles marked as read",
      colorClass:
        "text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10",
    },
    {
      title: "Bookmarks",
      value: stats.bookmarkedArticles,
      icon: Bookmark,
      description: "Articles saved for later",
      colorClass:
        "text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <CardHeader className="flex items-end justify-between">
              <CardTitle className="text-sm font-medium">
                <h2>{item.title}</h2>
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.colorClass}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function UserStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-8 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3.5 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
