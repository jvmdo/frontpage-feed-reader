import { z } from "zod";

export const AUTO_MARK_READ_MODES = [
  "immediately",
  "delayed",
  "manual",
] as const;

export type AutoMarkReadMode = (typeof AUTO_MARK_READ_MODES)[number];

export const updatePreferencesSchema = z.object({
  refreshInterval: z.number().min(0),
  autoMarkReadMode: z.enum(AUTO_MARK_READ_MODES),
  autoMarkReadDelay: z
    .number()
    .int()
    .min(1, "Delay must be at least 1 second.")
    .max(60, "Delay must be at most 60 seconds."),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
