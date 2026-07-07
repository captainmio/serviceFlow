import { Navigate, Route, Routes } from "react-router-dom";
import { CustomersPage } from "./pages/customers-page";
import { LoginPage } from "./pages/login-page";
import { ServicesPage } from "./pages/services-page";
import { useAuthStore } from "./stores/auth-store";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
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
