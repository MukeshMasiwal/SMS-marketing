import React from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { CampaignsPage } from "./pages/campaigns/CampaignsPage";
import { CreateCampaignPage } from "./pages/campaigns/CreateCampaignPage";
import { EditCampaignPage } from "./pages/campaigns/EditCampaignPage";
import { LogOut, User as UserIcon, Shield, Layers, Users, Megaphone, LayoutDashboard } from "lucide-react";

const MainLayout: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout, logoutAll } = useAuth();
  const path = window.location.pathname;

  const publicPaths = ["/login", "/signup", "/register", "/verify-email", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-zinc-400 font-medium">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users trying to access protected routes to /login
  if (!isAuthenticated && !isPublicPath) {
    window.location.href = "/login";
    return null;
  }

  // Render Public Auth Pages
  if (isPublicPath) {
    if (path.startsWith("/signup") || path.startsWith("/register")) return <SignupPage />;
    if (path.startsWith("/verify-email")) return <VerifyEmailPage />;
    if (path.startsWith("/forgot-password")) return <ForgotPasswordPage />;
    if (path.startsWith("/reset-password")) return <ResetPasswordPage />;
    return <LoginPage />;
  }

  // Determine active protected page component
  let PageComponent = CampaignsPage;
  if (path === "/campaigns/create") {
    PageComponent = CreateCampaignPage;
  } else if (path.startsWith("/campaigns/") && path.includes("/edit")) {
    PageComponent = EditCampaignPage;
  } else if (path === "/campaigns" || path === "/") {
    PageComponent = CampaignsPage;
  }

  const role = (user?.role || "").toLowerCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-zinc-100">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Megaphone className="h-4 w-4" />
            </div>
            <span>SMS Marketing</span>
          </a>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-zinc-400">
            <a
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                path === "/dashboard" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
              }`}
            >
              Dashboard
            </a>
            <a
              href="/campaigns"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                path.startsWith("/campaigns") || path === "/"
                  ? "bg-zinc-900 text-zinc-100 font-semibold"
                  : "hover:text-zinc-200"
              }`}
            >
              Campaigns
            </a>
          </nav>
        </div>

        {/* User Dropdown / Controls */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300">
              <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-zinc-100">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-zinc-800 text-zinc-400">
                {role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        <PageComponent />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" />
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
