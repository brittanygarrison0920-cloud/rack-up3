import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthGate({ children, title, description }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700 flex items-center justify-center mb-6 shadow-lg">
          <Lock className="w-10 h-10 text-purple-600 dark:text-purple-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title || "Sign in to continue"}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm">
          {description || "Create a free account or log in to start using RackUp."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            onClick={() => navigate(`/login?returnTo=${returnUrl}`)}
            className="flex-1 bg-gradient-to-r from-purple-900 to-purple-400 text-white"
          >
            Log In
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/register?returnTo=${returnUrl}`)}
            className="flex-1 border-purple-300 text-purple-700"
          >
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return children;
}