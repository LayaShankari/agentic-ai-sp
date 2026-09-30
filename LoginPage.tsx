import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Sparkles,
  HelpCircle,
  LogIn,
  X,
  CheckCircle2,
  AlertCircle,
  Bot,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useAuth, type Role } from "./AuthContext";

const ROLE_TABS: { id: Role; label: string; icon: typeof ShieldCheck }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "faculty", label: "Faculty", icon: User },
];

const APPROVED_DOMAINS = ["icfai.edu", "icfai.ac.in", "ifheindia.org", "edu.in", "ac.in"];

function isCollegeEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return APPROVED_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
}

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // CAPTCHA states
  const [captchaId, setCaptchaId] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("Loading verification...");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);

  // Modal dialog states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot / Reset Password state flow
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch a new CAPTCHA challenge from FastAPI backend
  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true);
    try {
      const res = await fetch("/api/auth/captcha-challenge");
      if (res.ok) {
        const data = await res.json();
        setCaptchaId(data.captcha_id);
        setCaptchaQuestion(data.question);
        setCaptchaAnswer("");
      } else {
        // Fallback local challenge if API unreachable
        setCaptchaId("local-fallback-challenge");
        setCaptchaQuestion("4 + 3 = ?");
        setCaptchaAnswer("");
      }
    } catch {
      setCaptchaId("local-fallback-challenge");
      setCaptchaQuestion("4 + 3 = ?");
      setCaptchaAnswer("");
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Secure Institutional Login
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your official college email address.");
      return;
    }

    if (!isCollegeEmail(trimmedEmail)) {
      setError("Access restricted. Please use an authorized institutional email (@icfai.edu, @icfai.ac.in, etc.).");
      return;
    }

    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    if (!captchaAnswer.trim()) {
      setError("Please complete the CAPTCHA verification challenge.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
          role: activeRole,
          captcha_id: captchaId,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Authentication failed. Please verify your credentials.");
        fetchCaptcha();
        setIsLoading(false);
        return;
      }

      // Backend role is strictly enforced from trusted database record
      const trustedRole: Role = data.user.role === "admin" ? "admin" : "faculty";
      login(data.user.email, trustedRole, data.user.name, data.token);

      navigate("/dashboard");
    } catch {
      setError("Unable to connect to the authentication server. Please check your network connection.");
      fetchCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Step 1 - Request 6-digit verification code
  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !isCollegeEmail(trimmedEmail)) {
      setForgotError("Please enter a valid institutional college email address (@icfai.edu, @icfai.ac.in).");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep("verify");
        if (data.reset_code) {
          setResetCode(data.reset_code);
          setForgotSuccess(`Verification code ${data.reset_code} generated for ${trimmedEmail}.`);
        } else {
          setForgotSuccess(data.message || "Verification code sent to your registered email.");
        }
      } else {
        setForgotError(data.detail || "Failed to process password reset request.");
      }
    } catch {
      setForgotError("Unable to connect to password reset service.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 - Verify code and set new password
  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!resetCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          reset_code: resetCode.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess("Password reset successfully! You can now log in with your new password.");
        setPassword(newPassword);
        setEmail(forgotEmail.trim());
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep("request");
          setForgotSuccess("");
          setResetCode("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2200);
      } else {
        setForgotError(data.detail || "Invalid or expired verification code.");
      }
    } catch {
      setForgotError("Failed to reset password. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const setDemoCredentials = (role: Role) => {
    setActiveRole(role);
    setEmail(`${role}@icfai.edu`);
    setPassword(role === "admin" ? "admin123" : "faculty123");
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

              {/* Role tabs: Admin & Faculty only */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/90 rounded-xl p-1 mt-6 border border-slate-200/60">
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
                      placeholder="Enter your college email (e.g. admin@icfai.edu)"
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

                {/* CAPTCHA Verification Component */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-brand-blue" />
                      Security Verification (CAPTCHA)
                    </label>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      disabled={isCaptchaLoading}
                      className="text-[11px] text-brand-blue hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      title="Refresh verification challenge"
                    >
                      <RefreshCw size={11} className={isCaptchaLoading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 shrink-0 select-none tracking-wider shadow-inner min-w-[100px] text-center">
                      {isCaptchaLoading ? "..." : captchaQuestion}
                    </div>
                    <input
                      type="text"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Enter answer"
                      className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition bg-slate-50/50 focus:bg-white"
                    />
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
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotStep("request");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    className="text-brand-blue font-semibold hover:underline text-sm cursor-pointer"
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
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-500 font-medium pb-2">
        ICFAI Tech School — Academic Project • For Educational Purposes Only
      </footer>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg mb-4">
              <HelpCircle className="text-brand-blue" size={22} />
              <span>Authentication Support</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Welcome to the <strong>ICFAI Tech School Decision Engine</strong>. Sign in using your authorized institutional college credentials and solve the CAPTCHA verification to proceed.
            </p>
            <div className="space-y-2 mb-5">
              <button
                type="button"
                onClick={() => {
                  setDemoCredentials("admin");
                  setShowHelpModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>Admin Account</span>
                <span className="text-brand-blue font-mono">admin@icfai.edu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoCredentials("faculty");
                  setShowHelpModal(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>Faculty Account</span>
                <span className="text-brand-blue font-mono">faculty@icfai.edu</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2.5 mb-2">
              <KeyRound className="text-brand-blue" size={20} />
              <h3 className="text-lg font-bold text-slate-900">
                {forgotStep === "request" ? "Reset your password" : "Enter Verification Code"}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {forgotStep === "request"
                ? "Enter your official institutional college email address to receive a secure time-limited verification code."
                : `Enter the 6-digit verification code issued for ${forgotEmail} along with your new password.`}
            </p>

            {forgotError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-brand-red bg-red-50 border border-red-100 p-2.5 rounded-lg">
                <AlertCircle size={15} className="shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === "request" ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    College Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@icfai.edu"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full bg-brand-blue text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                >
                  {isForgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep("request")}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 bg-brand-blue hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                  >
                    {isForgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Confirm & Reset"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
