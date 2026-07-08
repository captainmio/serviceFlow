import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProjectFormPage } from "./pages/project-form-page";
import { ProjectsPage } from "./pages/projects-page";
import { CustomersPage } from "./pages/customers-page";
import { LoginPage } from "./pages/login-page";
import { NotFoundPage } from "./pages/not-found-page";
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

const LegacyProjectEditRedirect = () => {
  const { jobId } = useParams();
  return <Navigate to={jobId ? `/projects/${jobId}/edit` : "/projects"} replace />;
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
      <Route path="/jobs" element={<Navigate to="/projects" replace />} />
      <Route path="/jobs/new" element={<Navigate to="/projects/new" replace />} />
      <Route path="/jobs/:jobId/edit" element={<LegacyProjectEditRedirect />} />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/edit"
        element={
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        }
      />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
