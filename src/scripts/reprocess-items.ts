import { eq } from "drizzle-orm";
import { db } from "../db";
import { feedItems, feeds } from "../db/schema";
import { processItem } from "../lib/feed/processor";

async function reprocess() {
  console.log("Starting reprocessing of all feed items...");

  // 1. Fetch all items joined with their feeds to get base URLs
  const allItems = await db
    .select({
      item: feedItems,
      feedUrl: feeds.url,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id));

  console.log(`Found ${allItems.length} items to reprocess.`);

  let updatedCount = 0;

  for (const row of allItems) {
    const { item, feedUrl } = row;

    if (!item.rawPayload) {
      // console.warn(`Skipping item ${item.id} - No rawPayload available for reprocessing.`);
      continue;
    }

    try {
      // 2. Re-run the processor on the raw payload
      const processed = await processItem(item.rawPayload, feedUrl);

      // 3. Update the record
      await db
        .update(feedItems)
        .set({
          title: processed.title,
          description: processed.description,
          content: processed.content,
          textContent: processed.textContent,
          url: processed.url,
          author: processed.author,
        })
        .where(eq(feedItems.id, item.id));

      updatedCount++;
      if (updatedCount % 100 === 0) {
        console.log(`Processed ${updatedCount}/${allItems.length} items...`);
      }
    } catch (error) {
      console.error(`Failed to process item ${item.id}:`, error);
    }
  }

  console.log(`\nSuccess! ${updatedCount} items reprocessed.`);
}

reprocess().catch(console.error);
