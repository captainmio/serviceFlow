import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/features/auth/login-form";
import { useAuthStore } from "../stores/auth-store";

export const LoginPage = () => {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return <main className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)]" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)] px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden rounded-[2rem] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(11,20,55,0.08)] lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4318FF] text-lg font-bold text-white">
              S
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-[#2B3674]">ServiceFlow</p>
              <p className="text-sm text-[#A3AED0]">Operations Admin</p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <div className="rounded-2xl bg-[#F4F7FE] px-4 py-3 text-sm font-semibold text-[#4318FF]">
              Secure login
            </div>
            <div className="rounded-2xl px-4 py-3 text-sm text-[#707EAE]">Customer operations</div>
            <div className="rounded-2xl px-4 py-3 text-sm text-[#707EAE]">Projects and field work</div>
            <div className="rounded-2xl px-4 py-3 text-sm text-[#707EAE]">Invoices and payments</div>
          </div>

          <div className="mt-auto rounded-[1.75rem] bg-[linear-gradient(180deg,#7551FF_0%,#4318FF_100%)] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Initial access</p>
            <h2 className="mt-3 text-2xl font-bold">Seeded admin account</h2>
          </div>
        </aside>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="flex flex-col justify-between rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">Pages / Authentication</p>
              <h1 className="mt-3 max-w-2xl text-5xl font-bold leading-tight tracking-tight text-[#2B3674]">
                A brighter command center for service operations.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#707EAE]">
                This login experience sets the tone for a data-heavy admin product: soft panels,
                strong hierarchy, roomy tables, and consistent reusable cards.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[#F8FAFF] p-5">
                <p className="text-sm text-[#A3AED0]">JWT auth</p>
                <p className="mt-3 text-2xl font-bold text-[#2B3674]">Active</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#F8FAFF] p-5">
                <p className="text-sm text-[#A3AED0]">Role system</p>
                <p className="mt-3 text-2xl font-bold text-[#2B3674]">3 roles</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#F8FAFF] p-5">
                <p className="text-sm text-[#A3AED0]">Database seeding</p>
                <p className="mt-3 text-2xl font-bold text-[#2B3674]">Ready</p>
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium text-[#A3AED0]">Welcome back</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#2B3674]">Sign in</h2>
            </div>
            <LoginForm />
          </section>
        </section>
      </div>
    </main>
  );
};
