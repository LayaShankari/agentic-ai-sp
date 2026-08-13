import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  EyeIcon,
  Sparkles,
  HelpCircle,
  LogIn,
  X,
  CheckCircle2,
  AlertCircle,
  Bot
} from "lucide-react";
import { useAuth, type Role } from "./AuthContext";

const ROLE_TABS: { id: Role; label: string; icon: typeof ShieldCheck }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "faculty", label: "Faculty", icon: User },
  { id: "viewer", label: "Viewer", icon: EyeIcon },
];

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal dialog states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Allow anybody to login smoothly
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const userEmail = email.trim() || `${activeRole}@icfai.edu`;

    setTimeout(() => {
      setIsLoading(false);
      login(userEmail, activeRole);
      navigate("/dashboard");
    }, 300);
  };

  // Redirect to official Google sign-in page
  const handleGoogleSignIn = () => {
    window.location.href = "https://accounts.google.com/ServiceLogin";
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotModal(false);
      setForgotEmail("");
    }, 2000);
  };

  const setDemoCredentials = (role: Role) => {
    setActiveRole(role);
    setEmail(`${role}@icfai.edu`);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between items-center p-4 md:p-8 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">

          {/* Left panel - Brand & AI Showcase */}
          <div className="relative md:w-[46%] bg-[#0A1F44] text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[480px]">
            {/* Campus Background Image Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1200&auto=format&fit=crop')`
              }}
            />

            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#07132B]/90 via-[#0A1F44]/95 to-[#050D1E]/95" />

            {/* Top Brand Logo */}
            <div className="relative z-10">
              <div className="inline-block">
                <div className="text-3xl font-serif font-bold tracking-wider text-white flex items-start gap-0.5">
                  ICFAI
                  <span className="text-[10px] font-sans font-normal align-top leading-none mt-1">®</span>
                </div>
                <div className="bg-[#E31E24] text-white text-[11px] font-bold tracking-[0.2em] px-2.5 py-0.5 mt-1 inline-block rounded-xs shadow-sm">
                  TECH SCHOOL
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold leading-[1.15] mt-10 tracking-tight">
                Agentic AI
                <br />
                Institutional
                <br />
                Decision Engine
              </h1>
              <p className="text-slate-300 mt-4 text-sm font-medium leading-relaxed">
                AI-Powered Insights.
                <br />
                Smarter Decisions.
              </p>
            </div>

            {/* Bottom AI Badge Widget */}
            <div className="relative z-10 flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 mt-8 shadow-lg">
              <div className="w-11 h-11 rounded-full bg-indigo-950/70 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300 shadow-inner">
                <Bot size={22} />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  AI-Driven Campus Intelligence
                  <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                </div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Transforming data into actionable insights for a better tomorrow.
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Authentication Form */}
          <div className="md:w-[54%] p-8 md:p-10 relative bg-white flex flex-col justify-between">
            <div>
              {/* Header & Need help button */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back!</h2>
                  <p className="text-slate-500 text-sm mt-1">Sign in to access your dashboard</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs flex items-center gap-1.5 border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition shadow-2xs font-medium"
                >
                  Need help? <HelpCircle size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Role tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 rounded-xl p-1 mt-6 border border-slate-200/60">
                {ROLE_TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeRole === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveRole(id);
                        setError("");
                      }}
                      className={`relative flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-all ${isActive
                          ? "bg-white text-brand-blue shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                        }`}
                    >
                      <Icon size={16} className={isActive ? "text-brand-blue" : "text-slate-400"} />
                      {label}
                      {isActive && (
                        <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand-blue rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition bg-slate-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-brand-red bg-red-50 border border-red-100 p-2.5 rounded-lg">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-brand-blue font-semibold hover:underline text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue hover:bg-[#1E40AF] text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer mt-2 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-xs text-slate-400 font-medium">or continue with</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-500 font-medium pb-2">
        © 2025 ICFAI Tech School. All rights reserved.
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg mb-4">
              <HelpCircle className="text-brand-blue" size={22} />
              <span>Authentication Support</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Welcome to the <strong>ICFAI Tech School Decision Engine</strong>. Select any role tab or click <strong>Sign in with Google</strong> to authenticate immediately.
            </p>
            <div className="space-y-2 mb-5">
              <button
                onClick={() => {
                  setDemoCredentials("admin");
                  setShowHelpModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                <span>Admin Demo</span>
                <span className="text-brand-blue font-mono">admin@icfai.edu</span>
              </button>
              <button
                onClick={() => {
                  setDemoCredentials("faculty");
                  setShowHelpModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                <span>Faculty Demo</span>
                <span className="text-brand-blue font-mono">faculty@icfai.edu</span>
              </button>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reset your password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your official institutional email address and we'll send you instructions to reset your password.
            </p>

            {forgotSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span>Password reset link sent to {forgotEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@icfai.edu"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
                <button
                  type="submit"
                  className="w-full bg-brand-blue text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
