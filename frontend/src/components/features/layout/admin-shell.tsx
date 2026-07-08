import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { logoutRequest } from "../../../services/auth-api";
import { useAuthStore } from "../../../stores/auth-store";
import { Button } from "../../ui/button";

interface NavigationItem {
  label: string;
  to: string;
}

const extendedNavigationItems: NavigationItem[] = [
  { label: "Customers", to: "/customers" },
  { label: "Services", to: "/services" },
  { label: "Projects", to: "/projects" }
];

interface AdminShellProps {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}

export const AdminShell = ({ title, eyebrow, description, children }: AdminShellProps) => {
  const user = useAuthStore((state) => state.user);
  const setAnonymous = useAuthStore((state) => state.setAnonymous);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } finally {
      setAnonymous();
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)] px-4 py-4 text-[#1B2559] sm:px-6">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between rounded-[1.75rem] bg-white px-4 py-4 shadow-[0_20px_60px_rgba(11,20,55,0.08)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4318FF] text-base font-bold text-white">
            S
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-[#2B3674]">ServiceFlow</p>
            <p className="text-xs text-[#A3AED0]">Operations Admin</p>
          </div>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#4318FF] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(67,24,255,0.22)] transition hover:bg-[#3311cc]"
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          Menu
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0B1437]/35" onClick={closeMobileMenu} />

          <section className="absolute right-4 top-4 z-10 w-[min(22rem,calc(100vw-2rem))] rounded-[2rem] bg-white p-5 shadow-[0_24px_80px_rgba(11,20,55,0.18)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold tracking-tight text-[#2B3674]">Menu</p>
                <p className="text-sm text-[#A3AED0]">{user?.name ?? "Unknown User"}</p>
              </div>
              <button
                className="text-sm font-semibold text-[#4318FF]"
                type="button"
                onClick={closeMobileMenu}
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {extendedNavigationItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "flex min-h-12 items-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-[#F4F7FE] text-[#4318FF]"
                        : "bg-[#FBFCFF] text-[#707EAE] hover:bg-[#F8FAFF] hover:text-[#2B3674]"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                className="flex min-h-12 w-full items-center rounded-2xl bg-[#FBFCFF] px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  void handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="mx-auto mt-4 grid min-h-[calc(100vh-2rem)] max-w-[1440px] gap-5 lg:mt-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden flex-col rounded-[2rem] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(11,20,55,0.08)] lg:flex">
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
            {extendedNavigationItems.map((item) => (
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
              className="mt-5 w-full bg-slate-950 text-white shadow-none hover:bg-slate-800"
              onClick={() => {
                void handleLogout();
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-3 rounded-[2rem] px-2 py-1 sm:px-4 md:flex-row md:items-center md:justify-between lg:px-6 lg:pt-2">
            <div>
              <p className="text-sm font-medium text-[#A3AED0]">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2B3674] sm:text-4xl">{title}</h1>
              {description ? <p className="mt-2 text-sm text-[#707EAE]">{description}</p> : null}
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
};
