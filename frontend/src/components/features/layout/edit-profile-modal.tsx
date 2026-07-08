import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changeOwnPasswordRequest } from "../../../services/user-api";
import { notify } from "../../../lib/notify";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const animationDurationMs = 220;

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().trim().min(8, "New password must be at least 8 characters long"),
    confirmNewPassword: z.string().min(1, "Retype new password is required")
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password and retyped password must match",
        path: ["confirmNewPassword"]
      });
    }

    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be different from the current password",
        path: ["newPassword"]
      });
    }
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

const defaultValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: ""
};

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
      reset(defaultValues);
    }, animationDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, reset]);

  if (!isMounted) {
    return null;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changeOwnPasswordRequest(values);
      notify.success("Password updated successfully.");
      onClose();
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to update password");
      setError("root", {
        message: error instanceof Error ? error.message : "Unable to update password"
      });
    }
  });

  const handleInvalidSubmit = () => {
    notify.error("Please fix the highlighted profile form errors and try again.");
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className={[
          "absolute inset-0 bg-[#0B1437]/35 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        ].join(" ")}
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      <section
        className={[
          "absolute left-1/2 top-1/2 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(11,20,55,0.18)] transition-all duration-200",
          isVisible ? "-translate-y-1/2 opacity-100" : "translate-y-[-45%] opacity-0"
        ].join(" ")}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#A3AED0]">Profile settings</p>
          <h2 className="text-2xl font-bold text-[#2B3674]">Edit profile</h2>
          <p className="text-sm leading-6 text-[#707EAE]">
            Change your password by entering your current password and confirming the new one.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(async (values) => {
          try {
            await changeOwnPasswordRequest(values);
            notify.success("Password updated successfully.");
            onClose();
          } catch (error: unknown) {
            notify.error(error instanceof Error ? error.message : "Unable to update password");
            setError("root", {
              message: error instanceof Error ? error.message : "Unable to update password"
            });
          }
        }, handleInvalidSubmit)}>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label="Retype new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />

          {errors.root?.message ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errors.root.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};
