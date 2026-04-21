import { z } from "zod";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";

export const addFeedSchema = z.object({
  url: z.url("Please enter a valid URL").trim(),
});

export type AddFeedInput = z.infer<typeof addFeedSchema>;

export const updateSubscriptionSchema = z.object({
  id: z.number(),
  customTitle: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(255)
    .nullable()
    .optional(),
  categoryId: z.number().nullable().optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const removeSubscriptionSchema = z.object({
  id: z.number(),
});

export type RemoveSubscriptionInput = z.infer<typeof removeSubscriptionSchema>;

export const refreshFeedSchema = z.object({
  id: z.number(),
});

export type RefreshFeedInput = z.infer<typeof refreshFeedSchema>;

export const markAsReadSchema = z.object({
  itemId: z.number(),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

export const feedItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(PAGINATION_LIMIT),
  offset: z.coerce.number().int().min(0).default(PAGINATION_INITIAL_OFFSET),
  feedId: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
});

export type FeedItemsQueryInput = z.infer<typeof feedItemsQuerySchema>;
