import { FeedIcon } from "@/components/feed/feed-icon";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Feed } from "@/types";

interface FeedPreviewCardProps {
  feed: Pick<Feed, "title" | "description" | "iconUrl"> | undefined;
  alreadySubscribed?: boolean;
}

export function FeedPreviewCard({
  feed,
  alreadySubscribed,
}: FeedPreviewCardProps) {
  if (!feed) return null;

  return (
    <Item variant="outline" size="default" data-tour="feed-preview-card">
      <ItemMedia>
        <FeedIcon url={feed.iconUrl} title={feed.title} size={48} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <div className="flex justify-between gap-2">
          <ItemTitle className="font-semibold truncate">
            {feed.title || "Untitled Feed"}
          </ItemTitle>
          {alreadySubscribed ? (
            <Badge variant="destructive">Already Subscribed</Badge>
          ) : (
            <Badge className="text-success bg-success/20">Ready</Badge>
          )}
        </div>
        {feed.description && (
          <ItemDescription className="text-xs">
            {feed.description}
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  );
}
