import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/features/auth/login-form";
import loginHeroIllustration from "../assets/login-hero-illustration.png";
import { useAuthStore } from "../stores/auth-store";

export const LoginPage = () => {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#EFF4FF_0%,#E8EEFF_40%,#EEF2FF_100%)]" />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#F9FBFF_0%,#EEF3FF_36%,#E8EEFF_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(255,138,58,0.18),rgba(255,255,255,0)_60%)]" />
        <div className="absolute left-[-7rem] top-[-5rem] h-52 w-52 rounded-full bg-[#2F80ED]/14 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-72 w-72 rounded-full bg-[#FF8D3A]/16 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1440px] items-center justify-center">
        <div className="grid min-h-[760px] w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_90px_rgba(15,23,61,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.2fr)_470px]">
            <section className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#FFF4E9_0%,#F4F8FF_20%,#E9F1FF_100%)] lg:block">
              <div className="absolute inset-0">
                <img
                  src={loginHeroIllustration}
                  alt="ServiceFlow operations dashboard illustration"
                  className="h-full w-full object-cover object-left"
                />
              </div>
              <div className="absolute inset-y-0 right-0 w-48 bg-[linear-gradient(90deg,rgba(244,248,255,0)_0%,rgba(255,255,255,0.9)_78%,#FFFFFF_100%)]" />
              <div className="absolute left-8 top-8 max-w-sm rounded-[1.75rem] border border-white/65 bg-white/72 p-5 shadow-[0_20px_45px_rgba(15,23,61,0.10)] backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF8D3A]">Project delivery</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#2B3674]">
                  Run customers, projects, and team assignments from one flow.
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#707EAE]">
                  A calmer sign-in experience built around the same ServiceFlow workspace your team uses every day.
                </p>
              </div>
            </section>

            <section className="relative flex items-center bg-white px-6 py-10 sm:px-10 lg:px-12">
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(244,247,254,0.72)_0%,rgba(244,247,254,0)_100%)]" />
              <div className="relative mx-auto w-full max-w-[360px]">
                <div className="mb-8">
                  <div className="flex items-center justify-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#2B3674_0%,#4318FF_100%)] text-lg font-bold text-white shadow-[0_14px_30px_rgba(67,24,255,0.24)]">
                      S
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-[#2B3674]">ServiceFlow</p>
                      <p className="text-sm text-[#A3AED0]">Operations workspace</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-medium text-[#A3AED0]">Pages / Authentication</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#2B3674]">Welcome back</h2>
                <p className="mt-4 text-sm leading-7 text-[#707EAE]">
                  Sign in to continue into your customer, project, service, and team management workspace.
                </p>

                <div className="mt-8 rounded-[2rem] border border-[#EEF2FF] bg-[#FBFCFF] p-5 shadow-[0_24px_50px_rgba(15,23,61,0.08)] sm:p-6">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A3AED0]">Sign in</p>
                    </div>
                  </div>

                  <LoginForm />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:hidden">
                  <div className="rounded-[1.4rem] border border-[#EEF2FF] bg-[#F8FAFF] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A3AED0]">Session</p>
                    <p className="mt-2 text-base font-bold text-[#2B3674]">15 minutes</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[#EEF2FF] bg-[#F8FAFF] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A3AED0]">Storage</p>
                    <p className="mt-2 text-base font-bold text-[#2B3674]">Cookie-based JWT</p>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </div>
    </main>
  );
};
