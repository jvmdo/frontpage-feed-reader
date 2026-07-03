import { useMutation } from "@tanstack/react-query";
import { updatePreferencesAction } from "@/actions/user/update-preferences-action";
import { usePreferencesStore } from "@/hooks/ui/use-preferences-store";
import type { UpdatePreferencesInput } from "@/lib/validations/user";

export function useUpdatePreferences() {
  const setAutoMarkRead = usePreferencesStore((s) => s.setAutoMarkRead);

  return useMutation({
    mutationFn: async (data: UpdatePreferencesInput) => {
      const result = await updatePreferencesAction(data);

      if (!result.success) {
        throw new Error(result.error || "Failed to update settings.");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      setAutoMarkRead(variables.autoMarkReadMode, variables.autoMarkReadDelay);
    },
  });
}
