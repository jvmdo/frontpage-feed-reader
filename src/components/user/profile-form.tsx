"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GuestDialog } from "@/components/auth/guest-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateProfile } from "@/hooks/user/use-update-profile";
import type { SessionUser } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import {
  type UpdateProfileInput,
  updateProfileSchema,
} from "@/lib/validations/profile";

interface ProfileFormProps {
  user: SessionUser & { createdAt: Date | string };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: user.name,
      image: user.image ?? "",
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success("Profile updated successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const initials = getInitials(user.name);
  const joinDate = user.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
          <CardHeader>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Avatar size="lg">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback className="text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center sm:text-left">
                <CardTitle className="text-lg">
                  <h2>{user.name}</h2>
                </CardTitle>
                <CardDescription className="text-sm">
                  {user.email}
                </CardDescription>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 sm:justify-start">
                  {user.isAnonymous ? (
                    <>
                      <Badge variant="destructive">Temporary Guest</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsGuestDialogOpen(true)}
                        className="h-7 text-xs px-2.5"
                      >
                        Save Progress
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary">Member</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Member since {format(joinDate, "MMMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="profile-name">Display Name</FieldLabel>
                <Input
                  id="profile-name"
                  type="text"
                  placeholder="Your display name"
                  disabled={isPending}
                  {...register("name")}
                />
                {errors.name && (
                  <FieldError id="profile-name-error">
                    {errors.name.message}
                  </FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.image}>
                <FieldLabel htmlFor="profile-image">
                  Avatar Image URL
                </FieldLabel>
                <Input
                  id="profile-image"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isPending}
                  {...register("image")}
                />
                {errors.image && (
                  <FieldError id="profile-image-error">
                    {errors.image.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      {isGuestDialogOpen && (
        <GuestDialog
          open={isGuestDialogOpen}
          onOpenChange={setIsGuestDialogOpen}
        />
      )}
    </>
  );
}
