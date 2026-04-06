import { z } from "zod";

export const addFeedSchema = z.object({
  url: z.url("Please enter a valid URL").trim(),
});

export type AddFeedInput = z.infer<typeof addFeedSchema>;

export const updateSubscriptionSchema = z.object({
  id: z.number(),
  customTitle: z.string().trim().min(1, "Title cannot be empty").max(255).nullable(),
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
