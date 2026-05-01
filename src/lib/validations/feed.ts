import { z } from "zod";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";

export const addFeedSchema = z.object({
  url: z.url("Please enter a valid URL").trim(),
});

export type AddFeedInput = z.infer<typeof addFeedSchema>;

export const updateFeedSchema = z.object({
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

export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;

export const removeFeedSchema = z.object({
  id: z.number(),
});

export type RemoveFeedInput = z.infer<typeof removeFeedSchema>;

export const refreshFeedSchema = z
  .object({
    subscriptionId: z.number().optional(),
    feedId: z.number().optional(),
  })
  .refine((data) => data.subscriptionId !== undefined || data.feedId !== undefined, {
    message: "Either subscriptionId or feedId must be provided",
    path: ["subscriptionId"],
  });

export type RefreshFeedInput = z.infer<typeof refreshFeedSchema>;

export const markReadSchema = z.object({
  itemId: z.number(),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;

export const markAllReadSchema = z.object({
  scope: z.enum(["global", "category", "feed"]),
  id: z.coerce.number().optional(),
});

export type MarkAllReadInput = z.infer<typeof markAllReadSchema>;

export const itemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(PAGINATION_LIMIT),
  offset: z.coerce.number().int().min(0).default(PAGINATION_INITIAL_OFFSET),
  feedId: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
});

export type ItemsQueryInput = z.infer<typeof itemsQuerySchema>;
