import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../../stores/auth-store";
import { Button } from "../../ui/button";

interface NavigationItem {
  label: string;
  to: string;
}

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Customers", to: "/" },
  { label: "Projects", to: "/" },
  { label: "Invoices", to: "/" }
];

interface AdminShellProps {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}

export const AdminShell = ({ title, eyebrow, description, children }: AdminShellProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)] px-4 py-4 text-[#1B2559] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-[2rem] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4318FF] text-lg font-bold text-white">
              S
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">ServiceFlow</p>
              <p className="text-sm text-[#A3AED0]">Operations Admin</p>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-[#F4F7FE] text-[#4318FF]"
                      : "text-[#707EAE] hover:bg-[#F8FAFF] hover:text-[#2B3674]"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-[1.75rem] bg-[linear-gradient(180deg,#7551FF_0%,#4318FF_100%)] p-5 text-white shadow-[0_18px_40px_rgba(67,24,255,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Current user</p>
            <h2 className="mt-3 text-xl font-bold">{user?.name ?? "Unknown User"}</h2>
            <p className="mt-1 text-sm text-white/80">{user?.email ?? "No email"}</p>
            <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              {user?.role ?? "guest"}
            </p>
            <Button
              className="mt-5 w-full bg-white text-[#4318FF] shadow-none hover:bg-[#EEF2FF]"
              onClick={() => logout()}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-4 rounded-[2rem] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(11,20,55,0.08)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2B3674]">{title}</h1>
              <p className="mt-2 text-sm text-[#707EAE]">{description}</p>
            </div>
            <div className="rounded-2xl border border-[#E9EDF7] bg-[#F8FAFF] px-4 py-3 text-sm text-[#707EAE]">
              Secure workspace with JWT session handling
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
};
