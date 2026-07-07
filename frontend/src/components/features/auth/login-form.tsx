import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginRequest } from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth-store";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LoginForm = () => {
  const setSession = useAuthStore((state) => state.setSession);
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
      setSession(authResponse);
    } catch (error: unknown) {
      setError("root", {
        message: error instanceof Error ? error.message : "Unable to log in"
      });
    }
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
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
