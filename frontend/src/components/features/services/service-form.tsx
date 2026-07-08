import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notify } from "../../../lib/notify";
import type { Service, ServicePayload } from "../../../types/service";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Textarea } from "../../ui/textarea";

const animationDurationMs = 260;

const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Service name is required"),
  description: z.string().trim().max(255),
  defaultHourlyRate: z.coerce.number().positive("Default hourly rate must be greater than 0"),
  status: z.enum(["active", "inactive"])
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  isOpen: boolean;
  initialService?: Service | null;
  onClose: () => void;
  onCancelEdit: () => void;
  onSubmit: (payload: ServicePayload) => Promise<boolean>;
  isSubmitting: boolean;
}

const defaultValues: ServiceFormValues = {
  name: "",
  description: "",
  defaultHourlyRate: 120,
  status: "active"
};

export const ServiceForm = ({
  isOpen,
  initialService,
  onClose,
  onCancelEdit,
  onSubmit,
  isSubmitting
}: ServiceFormProps) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialService) {
      reset({
        name: initialService.name,
        description: initialService.description,
        defaultHourlyRate: initialService.defaultHourlyRate,
        status: initialService.status
      });
      return;
    }

    reset(defaultValues);
  }, [initialService, isOpen, reset]);

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
    }, animationDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const handleClose = () => {
    onCancelEdit();
    onClose();
  };

  const handleInvalidSubmit = () => {
    notify.error("Please fix the highlighted service form errors and try again.");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={[
          "absolute inset-0 z-0 bg-[#0B1437]/30 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        ].join(" ")}
        onClick={handleClose}
      />

      <section
        className={[
          "absolute right-0 top-0 z-10 h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-[-20px_0_60px_rgba(11,20,55,0.12)] transition-transform duration-300",
          isVisible ? "translate-x-0" : "translate-x-full"
        ].join(" ")}
      >
        <div className="flex min-h-full flex-col">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">Service details</p>
              <h2 className="mt-1 text-xl font-bold text-[#2B3674]">
                {initialService ? "Edit service" : "Add service"}
              </h2>
            </div>
            <button className="text-sm font-semibold text-[#4318FF]" type="button" onClick={handleClose}>
              Close
            </button>
          </div>

          <form
            className="mt-6 flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values);
            }, handleInvalidSubmit)}
          >
            <div className="grid gap-4">
              <Input label="Service name" error={errors.name?.message} {...register("name")} />
              <Textarea
                label="Description"
                error={errors.description?.message}
                placeholder="Describe what this service includes"
                {...register("description")}
              />
              <Input
                label="Default hourly rate"
                type="number"
                min="1"
                step="0.01"
                error={errors.defaultHourlyRate?.message}
                {...register("defaultHourlyRate")}
              />
              <Select label="Status" {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-end justify-end gap-3 border-t border-[#E9EDF7] pt-4">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
                  type="button"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialService ? "Update service" : "Add service"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
