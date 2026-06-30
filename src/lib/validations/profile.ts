import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  image: z.url("Invalid image URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(32, "New password must be at most 32 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
