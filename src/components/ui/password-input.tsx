"use client";

import { PasswordInput as ArkPasswordInput } from "@ark-ui/react/password-input";
import { type Options, passwordStrength } from "check-password-strength";
import { type VariantProps } from "class-variance-authority";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";

import { fieldVariants } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function PasswordInputRoot({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ArkPasswordInput.Root> &
  VariantProps<typeof fieldVariants>) {
  return (
    <ArkPasswordInput.Root
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function PasswordInputLabel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkPasswordInput.Label>) {
  return (
    <ArkPasswordInput.Label asChild {...props}>
      <Label
        data-slot="field-label"
        className={cn(
          "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-3 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
          "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
          className,
        )}
      >
        {children}
      </Label>
    </ArkPasswordInput.Label>
  );
}

function PasswordInputControl({
  className,
  ...props
}: React.ComponentProps<typeof ArkPasswordInput.Input>) {
  return (
    <ArkPasswordInput.Control className="relative flex w-full">
      <ArkPasswordInput.Input
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "pr-9", // padding for the eye icon
          className,
        )}
        {...props}
      />
      <ArkPasswordInput.VisibilityTrigger
        className={cn(
          "absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <ArkPasswordInput.Indicator
          fallback={<EyeOffIcon className="h-4 w-4" />}
        >
          <EyeIcon className="h-4 w-4" />
        </ArkPasswordInput.Indicator>
      </ArkPasswordInput.VisibilityTrigger>
    </ArkPasswordInput.Control>
  );
}

const strengthOptions: Options<string> = [
  { id: 0, value: "weak", minDiversity: 0, minLength: 0 },
  { id: 1, value: "medium", minDiversity: 2, minLength: 6 },
  { id: 2, value: "strong", minDiversity: 4, minLength: 8 },
];

function PasswordInputStrengthMeter({ password }: { password?: string }) {
  const strength = useMemo(() => {
    if (!password) return null;
    const { value } = passwordStrength(password, strengthOptions);
    return value;
  }, [password]);

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            strength === "weak"
              ? "w-1/3 bg-destructive"
              : strength === "medium"
                ? "w-2/3 bg-yellow-500"
                : strength === "strong"
                  ? "w-full bg-green-500"
                  : "w-0",
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right capitalize">
        {strength} password
      </p>
    </div>
  );
}

export const PasswordInput = {
  Root: PasswordInputRoot,
  Label: PasswordInputLabel,
  Control: PasswordInputControl,
  StrengthMeter: PasswordInputStrengthMeter,
};
