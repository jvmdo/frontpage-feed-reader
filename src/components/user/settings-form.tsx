"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/actions/user/update-preferences-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type UpdatePreferencesInput,
  updatePreferencesSchema,
} from "@/lib/validations/user";

interface SettingsFormProps {
  initialData: UpdatePreferencesInput;
}

/**
 * Form for updating user preferences, specifically the auto-refresh interval.
 */
export function SettingsForm({ initialData }: SettingsFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePreferencesInput>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: UpdatePreferencesInput) => {
    const result = await updatePreferencesAction(data);

    if (result.success) {
      toast.success("Settings updated successfully.");
    } else {
      toast.error(result.error || "Failed to update settings.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader>
          <CardTitle>Feed Refresh</CardTitle>
          <CardDescription>
            Configure how often you want your feeds to be updated in the
            background.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.refreshInterval}>
              <FieldLabel htmlFor="refreshInterval">
                Auto-Refresh Interval
              </FieldLabel>
              <Controller
                name="refreshInterval"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isSubmitting}
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger
                      id="refreshInterval"
                      aria-describedby={
                        errors.refreshInterval
                          ? "refreshInterval-error"
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Manual only</SelectItem>
                      <SelectItem value="900">Every 15 minutes</SelectItem>
                      <SelectItem value="1800">Every 30 minutes</SelectItem>
                      <SelectItem value="3600">Every hour</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Shorter intervals keep your content fresher but may use more
                resources.
              </FieldDescription>
              {errors.refreshInterval && (
                <FieldError id="refreshInterval-error">
                  {errors.refreshInterval.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
