import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginRequest } from "../../../services/auth-api";
import { notify } from "../../../lib/notify";
import { useAuthStore } from "../../../stores/auth-store";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  rememberMe: z.boolean().default(false)
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LoginForm = () => {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const handleInvalidSubmit = () => {
    notify.error("Please fix the highlighted login form errors and try again.");
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(async ({ email, password }) => {
        try {
          const authResponse = await loginRequest({ email, password });
          setAuthenticated(authResponse.user);
          notify.success("Signed in successfully.");
        } catch (error: unknown) {
          notify.error(error instanceof Error ? error.message : "Unable to log in");
          setError("root", {
            message: error instanceof Error ? error.message : "Unable to log in"
          });
        }
      }, handleInvalidSubmit)}
    >
      <div className="grid gap-5">
        <Input
          label="Username or email"
          type="text"
          autoComplete="username"
          placeholder="admin"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-[#707EAE]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-[#C9D2EA] accent-[#4318FF]"
            {...register("rememberMe")}
          />
          Remember me
        </label>

        <button
          type="button"
          className="text-left text-sm font-semibold text-[#4318FF] transition hover:text-[#2B3674] sm:text-right"
          onClick={() => notify.info("Forgot password flow is not available yet.")}
        >
          Forgot password?
        </button>
      </div>

      {errors.root?.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.root.message}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-2xl text-base shadow-[0_16px_40px_rgba(67,24,255,0.24)]"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-xs leading-6 text-[#A3AED0]">
        Secure access for customer operations, project delivery, and finance oversight.
      </p>
    </form>
  );
};
