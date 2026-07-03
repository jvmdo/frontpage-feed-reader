"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePreferencesStore } from "@/hooks/ui/use-preferences-store";
import { useUpdatePreferences } from "@/hooks/user/use-update-preferences";
import {
  type UpdatePreferencesInput,
  updatePreferencesSchema,
} from "@/lib/validations/user";

interface SettingsFormProps {
  initialData: UpdatePreferencesInput;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();
  const setAutoMarkRead = usePreferencesStore((s) => s.setAutoMarkRead);

  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<UpdatePreferencesInput>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: initialData,
  });

  // One-shot hydration: push the DB value into the local store on mount.
  useEffect(() => {
    setAutoMarkRead(
      initialData.autoMarkReadMode,
      initialData.autoMarkReadDelay,
    );
  }, [initialData, setAutoMarkRead]);

  const mode = watch("autoMarkReadMode");

  const onSubmit = async (data: UpdatePreferencesInput) => {
    updatePreferences(data, {
      onSuccess: () => {
        toast.success("Settings updated successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    disabled={isPending}
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

      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader>
          <CardTitle>Reading Behaviour</CardTitle>
          <CardDescription>
            Control when articles are automatically marked as read.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.autoMarkReadMode}>
              <FieldLabel htmlFor="autoMarkReadMode">
                Auto Mark as Read
              </FieldLabel>
              <Controller
                name="autoMarkReadMode"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="autoMarkReadMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">
                        Immediately on open
                      </SelectItem>
                      <SelectItem value="delayed">After a delay</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.autoMarkReadMode && (
                <FieldError id="autoMarkReadMode-error">
                  {errors.autoMarkReadMode.message}
                </FieldError>
              )}
            </Field>

            {mode === "delayed" && (
              <Field data-invalid={!!errors.autoMarkReadDelay}>
                <FieldLabel htmlFor="autoMarkReadDelay">
                  Delay (seconds)
                </FieldLabel>
                <Input
                  id="autoMarkReadDelay"
                  type="number"
                  min={1}
                  max={60}
                  disabled={isPending}
                  {...register("autoMarkReadDelay", { valueAsNumber: true })}
                />
                <FieldDescription>Between 1 and 60 seconds.</FieldDescription>
                {errors.autoMarkReadDelay && (
                  <FieldError id="autoMarkReadDelay-error">
                    {errors.autoMarkReadDelay.message}
                  </FieldError>
                )}
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" aria-hidden={true} />}
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardContent>
      </Card>

      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
