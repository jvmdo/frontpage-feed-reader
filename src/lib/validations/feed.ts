import { z } from "zod";

export const addFeedSchema = z.object({
  url: z.url("Please enter a valid URL").trim(),
});

export type AddFeedInput = z.infer<typeof addFeedSchema>;
