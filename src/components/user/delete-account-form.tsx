"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useDeleteAccount } from "@/hooks/user/use-delete-account";
import { useUserAccounts } from "@/hooks/user/use-user-accounts";
import {
  type DeleteAccountInput,
  deleteAccountSchema,
} from "@/lib/validations/profile";

export function DeleteAccountForm() {
  const { mutate: deleteAccount, isPending } = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
    },
  });

  const { data: accounts } = useUserAccounts();
  const hasPassword = accounts.some((acc) => acc.providerId === "credential");

  const onSubmit = async (data: DeleteAccountInput) => {
    deleteAccount(data, {
      onSuccess: () => {
        toast.success(
          "Account deleted successfully. We're sorry to see you go!",
        );
        reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <Card className="ring-destructive/50 *:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
      <CardHeader>
        <CardTitle className="text-destructive">
          <h2>Danger Zone</h2>
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all of your data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm font-medium">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <form noValidate onSubmit={handleSubmit(onSubmit)}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {hasPassword && (
                  <FieldGroup className="py-4">
                    <Field data-invalid={!!errors.password}>
                      <FieldLabel htmlFor="delete-account-password">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        id="delete-account-password"
                        type="password"
                        placeholder="••••••••"
                        disabled={isPending}
                        {...register("password")}
                      />
                      {errors.password && (
                        <FieldError id="delete-account-password-error">
                          {errors.password.message}
                        </FieldError>
                      )}
                    </Field>
                  </FieldGroup>
                )}

                <AlertDialogFooter className={!hasPassword ? "pt-4" : ""}>
                  <AlertDialogCancel disabled={isPending} type="button">
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending && <Spinner data-icon="inline-start" />}
                    {isPending ? "Deleting..." : "Yes, delete my account"}
                  </Button>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
