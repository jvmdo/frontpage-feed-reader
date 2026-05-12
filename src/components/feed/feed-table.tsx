import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FeedWithSubscription } from "@/types";
import { FeedRow } from "./feed-row";

interface FeedTableProps {
  data: FeedWithSubscription[];
}

export function FeedTable({ data }: FeedTableProps) {
  return (
    <div className="rounded-lg border bg-surface px-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-75">Title</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-35">Health Status</TableHead>
            <TableHead className="w-45">Last Fetched</TableHead>
            <TableHead className="w-25 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <FeedRow
              key={item.subscription.id}
              subscription={item.subscription}
              feed={item.feed}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
