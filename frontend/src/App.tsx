import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CustomersPage } from "./pages/customers-page";
import { LoginPage } from "./pages/login-page";
import { ServicesPage } from "./pages/services-page";
import { getSessionRequest } from "./services/auth-api";
import { useAuthStore } from "./stores/auth-store";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return <div className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)]" />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  const status = useAuthStore((state) => state.status);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setAnonymous = useAuthStore((state) => state.setAnonymous);

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    void (async () => {
      try {
        const session = await getSessionRequest();
        setAuthenticated(session.user);
      } catch {
        setAnonymous();
      }
    })();
  }, [setAnonymous, setAuthenticated, status]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/customers" replace />} />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
