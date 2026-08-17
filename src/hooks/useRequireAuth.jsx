import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnUrl}`);
      return false;
    }
    return true;
  };
}