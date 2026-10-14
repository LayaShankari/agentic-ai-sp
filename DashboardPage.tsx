import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  User,
  ShieldCheck,
  Trash2,
  Database,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Target,
  KeyRound,
  Lock,
  AlertCircle,
  Sparkles,
  Bot,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  ArrowRight,
  BookOpen,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "./AuthContext";
import ApplicationsByYearChart from "./ApplicationsByYearChart";
import AttendancePage from "./AttendancePage";
import AcademicsPage from "./AcademicsPage";

type ModuleId =
  | "dashboard"
  | "admissions"
  | "academics"
  | "attendance"
  | "settings"
  | "help";

interface ModuleConfig {
  id: ModuleId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const MODULES: ModuleConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of ICFAI Tech School Performance",
  },
  {
    id: "admissions",
    label: "Admissions",
    icon: Users,
    description: "Student Application & Intake Metrics",
  },
  {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
    description: "Course Grades, Pass Rates & Risk Analytics",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: CalendarCheck,
    description: "Institutional & Course Attendance Tracking",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "User Login Logs, Database Setup & System Settings",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    description: "Documentation, System Support & Assistance",
  },
];

interface RecommendationItem {
  id: string;
  category: "Admissions" | "Attendance" | "Academics" | "NPTEL/Internship" | "Placement";
  priority: "High" | "Medium" | "Low" | "Informational";
  title: string;
  condition: string;
  recommendation: string;
  metricEvidence: string;
  icon: typeof Users;
  actionText: string;
}

const AI_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "rec-1",
    category: "Admissions",
    priority: "High",
    title: "Increase CSE Seat Intake",
    condition: "CSE first-choice demand (31 applicants) exceeds available seats (30 seats).",
    recommendation: "Increase CSE intake capacity for the next academic year.",
    metricEvidence: "CSE: 31 First Choice Demand vs 30 Seats (100% Full)",
    icon: Users,
    actionText: "Review Intake",
  },
  {
    id: "rec-2",
    category: "Attendance",
    priority: "High",
    title: "Attendance Intervention Alert",
    condition: "Students falling below 65% attendance require immediate intervention.",
    recommendation: "Send attendance alerts and schedule parent-faculty meetings.",
    metricEvidence: "Attendance Alert: < 65% Minimum Attendance Threshold",
    icon: CalendarCheck,
    actionText: "Send Alerts",
  },
  {
    id: "rec-3",
    category: "Academics",
    priority: "Medium",
    title: "Schedule Remedial Classes",
    condition: "Students scoring below 40 marks are at academic risk in core subjects.",
    recommendation: "Conduct remedial classes and additional faculty tutoring.",
    metricEvidence: "Academic Risk: Scoring Below 40 Marks",
    icon: GraduationCap,
    actionText: "Schedule Remedials",
  },
  {
    id: "rec-4",
    category: "NPTEL/Internship",
    priority: "Medium",
    title: "Boost NPTEL & Internship Participation",
    condition: "Student participation in certified NPTEL courses needs improvement.",
    recommendation: "Run department awareness workshops and faculty mentoring.",
    metricEvidence: "Participation Tracking: Certified NPTEL & Internships",
    icon: BookOpen,
    actionText: "Run Workshops",
  },
  {
    id: "rec-5",
    category: "Placement",
    priority: "Medium",
    title: "Strengthen Placement Conversion",
    condition: "Internship-to-placement transition rate needs targeted support.",
    recommendation: "Provide technical interview bootcamps and expand hiring partnerships.",
    metricEvidence: "Conversion Track: Internship to Full-Time Hiring",
    icon: Briefcase,
    actionText: "Expand Hiring",
  },
];

const RECOMMENDATION_CATEGORY_STYLES: Record<RecommendationItem["category"], { rail: string; icon: string; label: string }> = {
  Admissions: { rail: "border-l-blue-500", icon: "bg-blue-50 text-blue-700 border-blue-200", label: "bg-blue-50 text-blue-800 border-blue-100" },
  Attendance: { rail: "border-l-teal-500", icon: "bg-teal-50 text-teal-700 border-teal-200", label: "bg-teal-50 text-teal-800 border-teal-100" },
  Academics: { rail: "border-l-violet-500", icon: "bg-violet-50 text-violet-700 border-violet-200", label: "bg-violet-50 text-violet-800 border-violet-100" },
  "NPTEL/Internship": { rail: "border-l-indigo-500", icon: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "bg-indigo-50 text-indigo-800 border-indigo-100" },
  Placement: { rail: "border-l-green-600", icon: "bg-green-50 text-green-700 border-green-200", label: "bg-green-50 text-green-800 border-green-100" },
};

const RECOMMENDATION_PRIORITY_STYLES: Record<RecommendationItem["priority"], {
  card: string;
  badge: string;
  indicator: string;
  condition: string;
  conditionLabel: string;
  recommendation: string;
  recommendationLabel: string;
  metric: string;
  pending: string;
  action: string;
}> = {
  High: {
    card: "border-rose-200 bg-rose-50/40 hover:border-rose-300",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    indicator: "bg-rose-500",
    condition: "bg-rose-50/80 border-rose-100",
    conditionLabel: "text-rose-700",
    recommendation: "bg-rose-50 border-rose-200",
    recommendationLabel: "text-rose-800",
    metric: "text-rose-700",
    pending: "bg-rose-50 text-rose-800 border-rose-200",
    action: "bg-rose-700 hover:bg-rose-800 focus-visible:ring-rose-300",
  },
  Medium: {
    card: "border-amber-200 bg-amber-50/40 hover:border-amber-300",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    indicator: "bg-amber-500",
    condition: "bg-amber-50/80 border-amber-100",
    conditionLabel: "text-amber-700",
    recommendation: "bg-orange-50 border-orange-200",
    recommendationLabel: "text-orange-800",
    metric: "text-amber-700",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    action: "bg-amber-700 hover:bg-amber-800 focus-visible:ring-amber-300",
  },
  Low: {
    card: "border-green-200 bg-green-50/40 hover:border-green-300",
    badge: "bg-green-100 text-green-800 border-green-200",
    indicator: "bg-green-500",
    condition: "bg-green-50/80 border-green-100",
    conditionLabel: "text-green-700",
    recommendation: "bg-emerald-50 border-emerald-200",
    recommendationLabel: "text-emerald-800",
    metric: "text-green-700",
    pending: "bg-green-50 text-green-800 border-green-200",
    action: "bg-green-700 hover:bg-green-800 focus-visible:ring-green-300",
  },
  Informational: {
    card: "border-blue-200 bg-blue-50/40 hover:border-blue-300",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    indicator: "bg-blue-500",
    condition: "bg-blue-50/80 border-blue-100",
    conditionLabel: "text-blue-700",
    recommendation: "bg-sky-50 border-sky-200",
    recommendationLabel: "text-sky-800",
    metric: "text-blue-700",
    pending: "bg-blue-50 text-blue-800 border-blue-200",
    action: "bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-300",
  },
};

const RECOMMENDATION_FILTER_STYLES: Record<string, { selected: string; idle: string }> = {
  All: { selected: "bg-slate-800 text-white border-slate-800", idle: "text-slate-600 border-transparent hover:bg-slate-100" },
  Admissions: { selected: "bg-blue-100 text-blue-900 border-blue-200", idle: "text-blue-700 border-transparent hover:bg-blue-50" },
  Attendance: { selected: "bg-teal-100 text-teal-900 border-teal-200", idle: "text-teal-700 border-transparent hover:bg-teal-50" },
  Academics: { selected: "bg-violet-100 text-violet-900 border-violet-200", idle: "text-violet-700 border-transparent hover:bg-violet-50" },
  "NPTEL/Internship": { selected: "bg-indigo-100 text-indigo-900 border-indigo-200", idle: "text-indigo-700 border-transparent hover:bg-indigo-50" },
  Placement: { selected: "bg-green-100 text-green-900 border-green-200", idle: "text-green-700 border-transparent hover:bg-green-50" },
};

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const activeConfig = MODULES.find((m) => m.id === activeModule) || MODULES[0];

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-[#0A1F44] text-white flex flex-col justify-between transition-all duration-300 z-30 shrink-0 shadow-xl`}
        >
          <div>
            {/* Logo Section */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="inline-block shrink-0">
                  <div className="text-2xl font-serif font-bold tracking-wider text-white flex items-start gap-0.5">
                    ICFAI
                    <span className="text-[9px] font-sans font-normal align-top leading-none mt-0.5">®</span>
                  </div>
                  <div className="bg-[#E31E24] text-white text-[9px] font-bold tracking-[0.18em] px-2 py-0.5 mt-0.5 inline-block rounded-xs shadow-xs">
                    TECH SCHOOL
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Modules */}
            <nav className="p-3 space-y-1.5 mt-2">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#2952E3] text-white shadow-md shadow-blue-900/30"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                    title={module.label}
                  >
                    <Icon size={19} className={isActive ? "text-white" : "text-slate-400"} />
                    {sidebarOpen && <span className="truncate">{module.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile Footer Widget */}
          <div className="p-4 border-t border-white/10 bg-[#071530]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-[#2952E3]/20 border border-[#2952E3]/40 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  <User size={20} className="text-blue-300" />
                </div>
                {sidebarOpen && (
                  <div className="truncate">
                    <div className="text-sm font-bold text-white truncate">
                      {user?.name || "Admin User"}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium capitalize">
                      {user?.role === "admin"
                        ? "Super Admin"
                        : "Faculty Member"}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-white/10"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* Top Header Bar */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
            {/* Left Header Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {activeConfig.label}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeConfig.description}
                </p>
              </div>
            </div>

            {/* Right Header Tools */}
            <div className="flex items-center gap-4">
              {/* Academic Year Badge */}
              <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs">
                <span>All Academic Years</span>
              </div>

              {/* Notifications Button & Popover Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((s) => !s)}
                  className={`relative p-2 rounded-xl border transition cursor-pointer ${
                    showNotifications
                      ? "bg-blue-50 text-brand-blue border-brand-blue/40 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 border-slate-200/80 hover:bg-slate-50"
                  }`}
                  title="Institutional AI Alerts & Recommendations"
                >
                  <Bell size={18} />
                  <span className="absolute -top-1 -right-1 bg-[#E31E24] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {AI_RECOMMENDATIONS.length}
                  </span>
                </button>

                {/* Notifications Dropdown Modal / Popover */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Dropdown Header */}
                      <div className="p-4 bg-[#0A1F44] text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300">
                            <Bot size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              Institutional AI Alerts
                              <span className="bg-[#E31E24] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                                5
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Real-time recommendations
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Notification Insights List */}
                      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-1">
                        {AI_RECOMMENDATIONS.map((rec) => {
                          const Icon = rec.icon;
                          const priorityStyle = RECOMMENDATION_PRIORITY_STYLES[rec.priority];
                          const categoryStyle = RECOMMENDATION_CATEGORY_STYLES[rec.category];

                          return (
                            <div
                              key={rec.id}
                              onClick={() => {
                                setActiveModule("dashboard");
                                setShowNotifications(false);
                              }}
                              className={`p-3 border-l-4 ${categoryStyle.rail} ${priorityStyle.card} hover:shadow-sm transition rounded-xl cursor-pointer space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setActiveModule("dashboard");
                                  setShowNotifications(false);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${categoryStyle.icon}`}>
                                    <Icon size={13} />
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {rec.title}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${priorityStyle.badge}`}>
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug pl-7">
                                {rec.recommendation}
                              </p>
                              <div className={`text-[10px] font-medium pl-7 flex items-center gap-1 ${priorityStyle.metric}`}>
                                <TrendingUp size={11} />
                                <span className="truncate">{rec.metricEvidence}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModule("dashboard");
                            setShowNotifications(false);
                          }}
                          className="w-full bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={13} />
                          <span>View All 5 Insights in Dashboard</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile Header Badge */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center text-brand-blue font-bold text-sm">
                  <User size={18} />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name || "Admin User"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {user?.role === "admin" ? "Super Admin" : "Faculty Member"}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Module Content View Renderer */}
          <main className="p-6 flex-1">
            {activeModule === "dashboard" && <MainDashboardView academicYear="All Academic Years" />}
            {activeModule === "admissions" && <AdmissionsModuleView />}
            {activeModule === "academics" && <AcademicsPage />}
            {activeModule === "attendance" && <AttendancePage />}
            {activeModule === "settings" && <SettingsModuleView />}
            {activeModule === "help" && <PlainModuleView title="Help & Support" />}
          </main>

          {/* Footer Copyright */}
          <footer className="px-6 py-4 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 bg-white">
            ICFAI Tech School — Academic Project • For Educational Purposes Only
          </footer>
        </div>
      </div>
    </div>
  );
}

function MainDashboardView({ academicYear }: { academicYear: string }) {
  const [totalApplications, setTotalApplications] = useState<number | null>(null);
  const [totalSeatCapacity, setTotalSeatCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/kpis/admissions/total-applications?academic_year=${encodeURIComponent(academicYear)}`
        );
        if (response.ok) {
          const json = await response.json();
          setTotalApplications(json.value);
        }
        const seatResponse = await fetch(
    '/api/kpis/admissions/total-seat-capacity'
);

if (seatResponse.ok) {
    const seatJson = await seatResponse.json();
    setTotalSeatCapacity(seatJson.value);
}
      } catch (e) {
        console.error("Error fetching total applications for dashboard summary:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [academicYear]);

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="text-[#2952E3]" size={24} />
            Institutional Performance Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time decision engine metrics for ICFAI Tech School.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            PostgreSQL Live Sync
          </span>
        </div>
      </div>

      {/* 8. Agentic AI Decision Engine — Separate from KPIs */}
      <AgenticRecommendationsWidget />

      {/* Existing KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications KPI Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2952E3]">
              <Users size={20} />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : (
            <div className="text-2xl font-extrabold text-slate-900">
              {totalApplications != null ? totalApplications.toLocaleString() : "0"}
            </div>
          )}
          <p className="text-xs text-slate-500 font-medium">
            Unique applicants ({academicYear})
          </p>
        </div>

       {/* Total Seat Capacity Card */}
<div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
      Total Seat Capacity
    </span>
    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
      <Database size={20} />
    </div>
  </div>

  <div className="text-2xl font-extrabold text-slate-900">
    {totalSeatCapacity != null ? totalSeatCapacity.toLocaleString() : "0"}
  </div>

  <p className="text-xs text-slate-500 font-medium">
    Total available seats
  </p>
</div>
       
        {/* Active Program Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Program
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">B.Tech</div>
          <p className="text-xs text-slate-500 font-medium">
            ICFAI Tech School
          </p>
        </div>

        {/* Dataset Academic Years Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Years Tracked
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">2023 – 2025</div>
          <p className="text-xs text-slate-500 font-medium">
            Verified PostgreSQL dataset
          </p>
        </div>
      </div>

    </div>
  );
}

function PlainModuleView({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 border border-slate-200/80 min-h-[450px] flex flex-col items-center justify-center text-center shadow-2xs">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        <LayoutDashboard size={28} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
        Plain module canvas. Ready for your custom KPIs and data analytics.
      </p>
    </div>
  );
}

function AgenticRecommendationsWidget() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [actionedIds, setActionedIds] = useState<Record<string, boolean>>({});
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const categories = ["All", "Admissions", "Attendance", "Academics", "NPTEL/Internship", "Placement"];

  const filteredRecs = selectedCategory === "All"
    ? AI_RECOMMENDATIONS
    : AI_RECOMMENDATIONS.filter((r) => r.category === selectedCategory);

  const handleAction = (rec: RecommendationItem) => {
    setActionedIds((prev) => ({ ...prev, [rec.id]: !prev[rec.id] }));
    const newStatus = !actionedIds[rec.id];
    setFeedbackToast(
      newStatus
        ? `Initiated action for "${rec.title}".`
        : `Reset status for "${rec.title}".`
    );
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-blue-100 shadow-lg shadow-blue-900/5 p-6 md:p-8 space-y-6">
      {/* Decorative top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0A1F44] via-[#2952E3] to-cyan-400" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-700/40 flex items-center justify-center shadow-xs">
              <Bot size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-[#2952E3] px-2.5 py-0.5 rounded-full border border-indigo-100">
              System Capability & Output
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Sparkles size={11} className="text-amber-500 fill-amber-500" />
              5 Active Insights
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Agentic AI Decision Engine
          </h2>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80" role="group" aria-label="Filter recommendations by category">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const filterStyle = RECOMMENDATION_FILTER_STYLES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={isSelected}
                className={`border text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 ${isSelected ? `${filterStyle.selected} shadow-xs` : `border-transparent ${filterStyle.idle}`}`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Alert Feedback */}
      {feedbackToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecs.map((rec) => {
          const Icon = rec.icon;
          const isActioned = !!actionedIds[rec.id];
          const priorityStyle = RECOMMENDATION_PRIORITY_STYLES[rec.priority];
          const categoryStyle = RECOMMENDATION_CATEGORY_STYLES[rec.category];

          return (
            <div
              key={rec.id}
              className={`min-w-0 rounded-2xl border border-l-4 ${categoryStyle.rail} ${priorityStyle.card} shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between gap-4`}
            >
              <div className="space-y-4">
                {/* Top Card Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${categoryStyle.icon}`}>
                      <Icon size={16} />
                    </span>
                    <span className={`max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-bold ${categoryStyle.label}`}>{rec.category}</span>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${priorityStyle.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.indicator}`} />
                    {rec.priority} Priority
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {rec.title}
                </h3>

                {/* Condition */}
                <div className={`border rounded-xl p-3 text-xs ${priorityStyle.condition}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${priorityStyle.conditionLabel}`}>
                    Condition:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {rec.condition}
                  </p>
                </div>

                {/* Recommendation */}
                <div className={`border rounded-xl p-3 text-xs ${priorityStyle.recommendation}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1 ${priorityStyle.recommendationLabel}`}>
                    <Lightbulb size={12} className={priorityStyle.recommendationLabel} />
                    Recommendation:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    {rec.recommendation}
                  </p>
                </div>

                {/* Metric Evidence Tag */}
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold pt-1 ${priorityStyle.metric}`}>
                  <TrendingUp size={13} className="shrink-0" />
                  <span className="truncate">{rec.metricEvidence}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isActioned ? "bg-emerald-50 text-emerald-800 border-emerald-200" : priorityStyle.pending}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActioned ? "bg-emerald-500" : priorityStyle.indicator}`} />
                  {isActioned ? "Status: Action Initiated" : "Status: Pending"}
                </span>
                <button
                  type="button"
                  onClick={() => handleAction(rec)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isActioned ? "bg-emerald-700 hover:bg-emerald-800 text-white focus-visible:ring-emerald-300" : `${priorityStyle.action} text-white shadow-2xs`}`}
                >
                  {isActioned ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Actioned</span>
                    </>
                  ) : (
                    <>
                      <span>{rec.actionText}</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsModuleView() {
  const { user, loginLogs, clearLogs } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");

    if (!user?.email) {
      setChangeError("No active user session found.");
      return;
    }

    if (newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError("New passwords do not match.");
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChangeSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setChangeError(data.detail || "Failed to update password. Verify your current password.");
      }
    } catch {
      setChangeError("Failed to connect to authentication server.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security & Password Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update password for <span className="font-semibold text-slate-700">{user?.email}</span> ({user?.role === "admin" ? "Super Admin" : "Faculty Member"}).
            </p>
          </div>
        </div>

        {changeError && (
          <div className="flex items-center gap-2 text-xs text-brand-red bg-red-50 border border-red-100 p-3 rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{changeError}</span>
          </div>
        )}

        {changeSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{changeSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isChanging}
              className="bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-75 flex items-center gap-2"
            >
              {isChanging ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Login Activity Audit Log */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-brand-blue" size={20} />
              User Login Activity & Audit Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of user logins, role access, timestamps, and session devices.
            </p>
          </div>
          <button
            onClick={clearLogs}
            className="text-xs flex items-center gap-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">User Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Status</th>
                <th className="p-3">Device / Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loginLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No login logs recorded yet. Log out and sign in to generate live logs!
                  </td>
                </tr>
              ) : (
                loginLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-900">{log.email}</td>
                    <td className="p-3">
                      <span className="capitalize font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {log.timestamp}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{log.device}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend PostgreSQL Guide Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <Database className="text-blue-400" size={22} />
          <div>
            <h3 className="text-sm font-bold text-white">PostgreSQL & FastAPI Login Log Schema (Backend Setup)</h3>
            <p className="text-xs text-slate-400">How logins are persisted in PostgreSQL database in production</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl font-mono text-slate-300 space-y-1">
            <div className="text-blue-400 font-bold mb-2"># PostgreSQL Table Schema</div>
            <div><span className="text-purple-400">CREATE TABLE</span> login_logs (</div>
            <div className="pl-4">id SERIAL PRIMARY KEY,</div>
            <div className="pl-4">user_email VARCHAR(255) NOT NULL,</div>
            <div className="pl-4">role VARCHAR(50) NOT NULL,</div>
            <div className="pl-4">timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,</div>
            <div className="pl-4">ip_address VARCHAR(45),</div>
            <div className="pl-4">status VARCHAR(20) DEFAULT 'SUCCESS'</div>
            <div>);</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl font-mono text-slate-300 space-y-1">
            <div className="text-blue-400 font-bold mb-2"># SQL Query to View All Logins</div>
            <div className="text-purple-400">SELECT * FROM login_logs</div>
            <div className="text-purple-400">ORDER BY timestamp DESC;</div>
            <div className="text-slate-500 mt-4">// Run in pgAdmin, DBeaver, or psql terminal</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdmissionsRateData {
  kpi: string;
  value: number | null;
  available?: boolean;
  allocated_students?: number;
  total_capacity?: number;
  capacity_by_department_year?: { academic_year: string; department: string; capacity: number }[];
  over_capacity?: boolean;
  message?: string | null;
}
interface FirstChoiceDepartment { department: string; first_choice_allocations: number; }
interface SecondChoiceDepartment { department: string; second_choice_allocations: number; }

function AdmissionsModuleView() {
  const [academicYear, setAcademicYear] = useState("All");
  const [department, setDepartment] = useState("All");
  const [years, setYears] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [seatUtilization, setSeatUtilization] = useState<AdmissionsRateData | null>(null);
  const [secondChoiceByDepartment, setSecondChoiceByDepartment] = useState<SecondChoiceDepartment[]>([]);
  const [firstChoiceByDepartment, setFirstChoiceByDepartment] = useState<FirstChoiceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmissions = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setSeatUtilization(null);
    setFirstChoiceByDepartment([]);
    setSecondChoiceByDepartment([]);
    const year = encodeURIComponent(academicYear);
    const selectedDepartment = encodeURIComponent(department);
    try {
      const fetchOptions = signal ? { signal } : undefined;
      const [yearListResponse, totalResponse, utilizationResponse, capacityResponse, firstByDeptResponse, secondByDeptResponse] = await Promise.all([
        fetch("/api/kpis/admissions/applications-by-year", fetchOptions),
        fetch(`/api/kpis/admissions/total-applications?academic_year=${year}&department=${selectedDepartment}`, fetchOptions),
        fetch(`/api/kpis/admissions/seat-utilization-rate?academic_year=${year}&department=${selectedDepartment}`, fetchOptions),
        fetch(`/api/kpis/admissions/total-seat-capacity?academic_year=${year}`, fetchOptions),
        fetch(`/api/kpis/admissions/first-choice-by-department?academic_year=${year}&department=${selectedDepartment}`, fetchOptions),
        fetch(`/api/kpis/admissions/second-choice-by-department?academic_year=${year}&department=${selectedDepartment}`, fetchOptions),
      ]);
      if (![yearListResponse, totalResponse, utilizationResponse, capacityResponse, firstByDeptResponse, secondByDeptResponse].every((response) => response.ok)) {
        throw new Error("One or more Admissions analytics requests failed.");
      }
      const [byYear, total, utilization, capacityDirectory, firstByDept, secondByDept] = await Promise.all([
        yearListResponse.json(), totalResponse.json(), utilizationResponse.json(), capacityResponse.json(), firstByDeptResponse.json(), secondByDeptResponse.json(),
      ]);
      setYears(byYear.map((row: { academic_year: string }) => String(row.academic_year)));
      setDepartments((capacityDirectory.capacity_by_department || []).map((row: { department: string }) => row.department));
      setTotalApplications(Number(total.value || 0));
      setSeatUtilization(utilization);
      setFirstChoiceByDepartment(firstByDept);
      setSecondChoiceByDepartment(secondByDept);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error loading Admissions analytics:", err);
      setError("Unable to load admissions analytics. Check the backend connection and retry.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchAdmissions(controller.signal);
    return () => controller.abort();
  }, [academicYear, department]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] p-6 md:p-7 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15"><Users size={23} /></span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">Admissions Analytics</h1>
                <p className="mt-1 text-sm text-blue-100/90">Applications, seat utilization, and allocation outcomes</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="admissions-year" className="text-xs font-semibold text-blue-100">Academic year</label>
            <select id="admissions-year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              <option value="All">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <label htmlFor="admissions-department" className="text-xs font-semibold text-blue-100">Department</label>
            <select id="admissions-department" value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              <option value="All">All departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button onClick={() => void fetchAdmissions()} className="rounded-xl border border-white/20 p-2.5 text-white hover:bg-white/10" aria-label="Refresh admissions data"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Applications and seat utilization">
        <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-violet-700 p-5 text-white shadow-md">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Total Applications</h2><Users size={20} /></div>
          <p className="mt-3 text-3xl font-extrabold">{loading ? "?" : totalApplications.toLocaleString()}</p>
          <p className="mt-1 text-xs text-blue-100">{department === "All" ? "Unique applicants across departments" : `Unique applicants with a ${department} preference or allocation`} in {academicYear === "All" ? "all academic years" : academicYear}</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-cyan-700 p-5 text-white shadow-md">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Seat Utilization</h2><Database size={20} /></div>
          <p className="mt-3 text-3xl font-extrabold">
            {loading ? "?" : seatUtilization?.available && seatUtilization.value != null ? `${Number(seatUtilization.value).toFixed(2)}%` : "Unavailable"}
          </p>
          {seatUtilization?.available ? (
            <p className="mt-1 text-xs text-emerald-100" title="Unique students with a final allocated department divided by department seat capacity, multiplied by 100. Capacity is counted once per department and academic year.">
              {seatUtilization.allocated_students?.toLocaleString()} allocated / {seatUtilization.total_capacity?.toLocaleString()} seats
            </p>
          ) : !loading ? (
            <p className="mt-1 text-xs text-emerald-100">{seatUtilization?.message || "Allocated-student or seat-capacity data is unavailable."}</p>
          ) : null}
          {seatUtilization?.over_capacity && <p className="mt-2 rounded-lg bg-amber-100/20 px-2 py-1 text-xs font-semibold text-amber-100">Allocated students exceed available capacity.</p>}
          {seatUtilization?.available && seatUtilization.capacity_by_department_year?.length ? <p className="mt-2 text-xs leading-relaxed text-emerald-100" title="Department seat capacity for each selected academic year.">Capacity: {seatUtilization.capacity_by_department_year.map((item) => `${item.department} ${item.academic_year}: ${item.capacity}`).join(" | ")}</p> : null}
          <p className="mt-2 text-[11px] text-emerald-100/80" title="Seat utilization is unique allocated students divided by total available department capacity, multiplied by 100.">Formula: allocated students / capacity, multiplied by 100</p>
        </article>
      </section>

      <ApplicationsByYearChart academicYear={academicYear} />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-lg">
          <div className="mb-4"><h2 className="text-lg font-extrabold text-slate-900">First Choice Allocations by Department</h2><p className="text-sm text-slate-500">Students allocated to the department they selected first</p></div>
          <div className="h-72">
            {firstChoiceByDepartment.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={firstChoiceByDepartment} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
              <CartesianGrid stroke="#EDE9FE" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="department" tickLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 10px 25px -5px rgba(15,23,42,0.15)" }} formatter={(value) => [`${Number(value).toLocaleString()} students`, "First choice allocations"]} labelFormatter={(label) => `Department: ${label}`} />
              <Bar dataKey="first_choice_allocations" name="First choice allocations" fill="#6D5CE8" radius={[7,7,0,0]} />
            </BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No first-choice allocation data for this filter.</p>}
          </div>
        </article>
        <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-lg">
          <div className="mb-4"><h2 className="text-lg font-extrabold text-slate-900">Second Choice Allocations by Department</h2><p className="text-sm text-slate-500">Students allocated to the department they selected second</p></div>
          <div className="h-72">
            {secondChoiceByDepartment.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={secondChoiceByDepartment} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
              <CartesianGrid stroke="#EDE9FE" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="department" tickLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 10px 25px -5px rgba(15,23,42,0.15)" }} formatter={(value) => [`${Number(value).toLocaleString()} students`, "Second choice allocations"]} labelFormatter={(label) => `Department: ${label}`} />
              <Bar dataKey="second_choice_allocations" name="Second choice allocations" fill="#F59E0B" radius={[7,7,0,0]} />
            </BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No second-choice allocation data for this filter.</p>}
          </div>
        </article>
      </section>

    </div>
  );
}
