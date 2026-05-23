import { z } from "zod";

export const updatePreferencesSchema = z.object({
  refreshInterval: z.number().min(0),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
