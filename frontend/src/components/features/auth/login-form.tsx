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
  password: z.string().min(4, "Password must be at least 4 characters")
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
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const authResponse = await loginRequest(values);
      setAuthenticated(authResponse.user);
      notify.success("Signed in successfully.");
    } catch (error: unknown) {
      notify.error(error instanceof Error ? error.message : "Unable to log in");
      setError("root", {
        message: error instanceof Error ? error.message : "Unable to log in"
      });
    }
  });

  const handleInvalidSubmit = () => {
    notify.error("Please fix the highlighted login form errors and try again.");
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(async (values) => {
      try {
        const authResponse = await loginRequest(values);
        setAuthenticated(authResponse.user);
        notify.success("Signed in successfully.");
      } catch (error: unknown) {
        notify.error(error instanceof Error ? error.message : "Unable to log in");
        setError("root", {
          message: error instanceof Error ? error.message : "Unable to log in"
        });
      }
    }, handleInvalidSubmit)}>
      <Input
        label="Username or email"
        type="text"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root?.message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errors.root.message}
        </div>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};
