import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notify } from "../../../lib/notify";
import type { Customer, CustomerPayload } from "../../../types/customer";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";

const customerFormSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  status: z.enum(["active", "inactive"])
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  isOpen: boolean;
  initialCustomer?: Customer | null;
  onClose: () => void;
  onCancelEdit: () => void;
  onSubmit: (payload: CustomerPayload) => Promise<boolean>;
  isSubmitting: boolean;
}

const defaultValues: CustomerFormValues = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  status: "active"
};

const animationDurationMs = 260;

export const CustomerForm = ({
  isOpen,
  initialCustomer,
  onClose,
  onCancelEdit,
  onSubmit,
  isSubmitting
}: CustomerFormProps) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialCustomer) {
      reset({
        companyName: initialCustomer.companyName,
        contactPerson: initialCustomer.contactPerson,
        email: initialCustomer.email,
        phone: initialCustomer.phone,
        address: initialCustomer.address,
        status: initialCustomer.status
      });
      return;
    }

    reset(defaultValues);
  }, [initialCustomer, isOpen, reset]);

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
    notify.error("Please fix the highlighted customer form errors and try again.");
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
              <p className="text-sm font-medium text-[#A3AED0]">Customer details</p>
              <h2 className="mt-1 text-xl font-bold text-[#2B3674]">
                {initialCustomer ? "Edit customer" : "Create customer"}
              </h2>
            </div>
            <button
              className="text-sm font-semibold text-[#4318FF]"
              type="button"
              onClick={handleClose}
            >
              Close
            </button>
          </div>

          <form
            className="mt-6 flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit(async (values) => {
              const wasSuccessful = await onSubmit(values);

              if (wasSuccessful && !initialCustomer) {
                reset(defaultValues);
              }
            }, handleInvalidSubmit)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Company name" error={errors.companyName?.message} {...register("companyName")} />
              <Input label="Contact person" error={errors.contactPerson?.message} {...register("contactPerson")} />
              <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
              <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
              <Input
                label="Address"
                error={errors.address?.message}
                className="md:col-span-2"
                {...register("address")}
              />
              <Select label="Status" {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="mt-auto pt-6">
              <div className="flex items-end justify-end gap-3 border-t border-[#E9EDF7] pt-4 md:col-span-2">
                <button
                  className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
                  type="button"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialCustomer ? "Update customer" : "Create customer"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
