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
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { MessagesPage } from "./pages/messages/MessagesPage";

// Super Admin Pages
import { SuperAdminDashboardPage } from "./pages/super-admin/SuperAdminDashboardPage";
import { SuperAdminUsersPage } from "./pages/super-admin/SuperAdminUsersPage";
import { SuperAdminRolesPage } from "./pages/super-admin/SuperAdminRolesPage";
import { SuperAdminProviderPage } from "./pages/super-admin/SuperAdminProviderPage";
import { SuperAdminAuditLogsPage } from "./pages/super-admin/SuperAdminAuditLogsPage";
import { SuperAdminSecurityPage } from "./pages/super-admin/SuperAdminSecurityPage";
import { SuperAdminSystemSettingsPage } from "./pages/super-admin/SuperAdminSystemSettingsPage";

import { LogOut, User as UserIcon, Shield, Crown, Megaphone, MessageSquare, AlertTriangle, Radio, Activity, Lock, Sliders, FileText } from "lucide-react";

const Forbidden403: React.FC<{ role?: string; path?: string }> = ({ role, path }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
    <div className="p-4 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
      <AlertTriangle className="h-12 w-12" />
    </div>
    <h1 className="text-3xl font-bold text-zinc-100">403 - Access Forbidden</h1>
    <p className="text-zinc-400 max-w-md text-sm">
      Your current role (<span className="font-mono uppercase text-amber-400 font-semibold">{role || "USER"}</span>) does not have authorization to access <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded">{path}</code>.
    </p>
    <a
      href="/dashboard"
      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/20"
    >
      Return to Dashboard
    </a>
  </div>
);

const MainLayout: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
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

  const roleUpper = (user?.role || "USER").toUpperCase();

  // Determine active protected page component with strict route guards
  let PageComponent: React.ComponentType<any> = CampaignsPage;
  let pageProps: any = {};

  if (path.startsWith("/super-admin")) {
    if (roleUpper !== "SUPER_ADMIN") {
      PageComponent = () => <Forbidden403 role={roleUpper} path={path} />;
    } else {
      if (path === "/super-admin/users") {
        PageComponent = SuperAdminUsersPage;
        pageProps = { initialRoleFilter: "ALL" };
      } else if (path === "/super-admin/admins") {
        PageComponent = SuperAdminUsersPage;
        pageProps = { initialRoleFilter: "ADMIN" };
      } else if (path === "/super-admin/roles") {
        PageComponent = SuperAdminRolesPage;
      } else if (path === "/super-admin/provider") {
        PageComponent = SuperAdminProviderPage;
      } else if (path === "/super-admin/audit-logs") {
        PageComponent = SuperAdminAuditLogsPage;
      } else if (path === "/super-admin/security") {
        PageComponent = SuperAdminSecurityPage;
      } else if (path === "/super-admin/system") {
        PageComponent = SuperAdminSystemSettingsPage;
      } else {
        PageComponent = SuperAdminDashboardPage;
      }
    }
  } else if (path.startsWith("/admin")) {
    if (roleUpper !== "ADMIN" && roleUpper !== "SUPER_ADMIN") {
      PageComponent = () => <Forbidden403 role={roleUpper} path={path} />;
    } else {
      PageComponent = AdminUsersPage;
    }
  } else if (path.startsWith("/messages")) {
    PageComponent = MessagesPage;
  } else if (path === "/campaigns/create") {
    PageComponent = CreateCampaignPage;
  } else if (path.startsWith("/campaigns/") && path.includes("/edit")) {
    PageComponent = EditCampaignPage;
  } else if (path === "/campaigns" || path === "/" || path === "/dashboard") {
    PageComponent = CampaignsPage;
  }

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

          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
            {roleUpper === "SUPER_ADMIN" ? (
              <>
                <a
                  href="/super-admin"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    path === "/super-admin" ? "bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20" : "hover:text-zinc-200"
                  }`}
                >
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dashboard</span>
                </a>
                <a
                  href="/super-admin/users"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/users" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Users
                </a>
                <a
                  href="/super-admin/admins"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/admins" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Admins
                </a>
                <a
                  href="/super-admin/roles"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/roles" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Roles
                </a>
                <a
                  href="/super-admin/audit-logs"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/audit-logs" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Audit Logs
                </a>
                <a
                  href="/super-admin/provider"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/provider" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Provider
                </a>
                <a
                  href="/super-admin/security"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/security" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Security
                </a>
                <a
                  href="/super-admin/system"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/super-admin/system" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  System
                </a>
              </>
            ) : roleUpper === "ADMIN" ? (
              <>
                <a
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path === "/dashboard" ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/admin/users"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    path.startsWith("/admin")
                      ? "bg-purple-900/40 text-purple-200 font-semibold border border-purple-500/30"
                      : "hover:text-purple-300"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-purple-400" />
                  <span>Users Overview</span>
                </a>
                <a
                  href="/campaigns"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path.startsWith("/campaigns") ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Campaigns
                </a>
                <a
                  href="/messages"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    path.startsWith("/messages") ? "bg-zinc-900 text-zinc-100 font-semibold" : "hover:text-zinc-200"
                  }`}
                >
                  Messages
                </a>
              </>
            ) : (
              <>
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
                <a
                  href="/messages"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    path.startsWith("/messages")
                      ? "bg-zinc-900 text-zinc-100 font-semibold"
                      : "hover:text-zinc-200"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Messages</span>
                </a>
              </>
            )}
          </nav>
        </div>

        {/* User Dropdown / Controls */}
        {user && (
          <div className="flex items-center gap-3">
            {roleUpper === "SUPER_ADMIN" && (
              <a
                href="/super-admin"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Super Admin Portal</span>
              </a>
            )}

            {roleUpper === "ADMIN" && (
              <a
                href="/admin/users"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>Admin Portal</span>
              </a>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300">
              <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-zinc-100">{user.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                roleUpper === "SUPER_ADMIN"
                  ? "bg-amber-500/20 text-amber-400"
                  : roleUpper === "ADMIN"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}>
                {roleUpper}
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
        <PageComponent {...pageProps} />
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
