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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "./AuthContext";
import ApplicationsByYearChart from "./ApplicationsByYearChart";
import SeatsByBranchChart from "./SeatsByBranchChart";
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
  priority: "High" | "Medium" | "Low";
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
                          const priorityBadge =
                            rec.priority === "High"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200";

                          return (
                            <div
                              key={rec.id}
                              onClick={() => {
                                setActiveModule("dashboard");
                                setShowNotifications(false);
                              }}
                              className="p-3 hover:bg-slate-50 transition rounded-xl cursor-pointer space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                                    <Icon size={13} />
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {rec.title}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${priorityBadge}`}>
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug pl-7">
                                {rec.recommendation}
                              </p>
                              <div className="text-[10px] text-brand-blue font-medium pl-7 flex items-center gap-1">
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
            {activeModule === "admissions" && <AdmissionsModuleView academicYear="All Academic Years" />}
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
  const [seatsByBranch, setSeatsByBranch] = useState<
  { branch: string; seats_filled: number }[]
>([]);
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
const branchResponse = await fetch(
    '/api/kpis/admissions/seats-by-branch'
);

if (branchResponse.ok) {
    const branchJson = await branchResponse.json();
    setSeatsByBranch(branchJson);
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

      {/* Main Dashboard Visualization: Applications by Year Line Chart */}
      <ApplicationsByYearChart />
      <SeatsByBranchChart />
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
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0A1F44] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
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

          const priorityBadge =
            rec.priority === "High"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : rec.priority === "Medium"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200";

          return (
            <div
              key={rec.id}
              className={`rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 ${
                isActioned
                  ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
                  : "bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-md shadow-2xs"
              }`}
            >
              <div className="space-y-3">
                {/* Top Card Meta */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#2952E3] border border-blue-100 flex items-center justify-center">
                      <Icon size={16} />
                    </span>
                    <span className="text-xs font-bold text-slate-700">{rec.category}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                    {rec.priority} Priority
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {rec.title}
                </h3>

                {/* Condition */}
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Condition:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {rec.condition}
                  </p>
                </div>

                {/* Recommendation */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2952E3] flex items-center gap-1 mb-0.5">
                    <Lightbulb size={12} className="text-amber-500 fill-amber-500" />
                    Recommendation:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    {rec.recommendation}
                  </p>
                </div>

                {/* Metric Evidence Tag */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                  <TrendingUp size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{rec.metricEvidence}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  {isActioned ? "Status: Action Initiated" : "Status: Pending"}
                </span>
                <button
                  type="button"
                  onClick={() => handleAction(rec)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActioned
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-[#0A1F44] hover:bg-[#1A386D] text-white shadow-2xs"
                  }`}
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

interface TotalApplicationsData {
  kpi: string;
  value: number;
  academic_year: string;
  institution: string;
  program: string;
}

interface AdmissionsRateData {
  kpi: string;
  value: number;
}

interface BranchDemandData {
  branch: string;
  first_choice_applications: number;
  demand_percentage: number;
}

interface OverallAllocationData {
  allocated: number;
  total: number;
  rate: number;
}

function AdmissionsModuleView({ academicYear }: { academicYear: string }) {
  const [data, setData] = useState<TotalApplicationsData | null>(null);
  const [firstChoiceRate, setFirstChoiceRate] = useState<AdmissionsRateData | null>(null);
  const [secondChoiceRate, setSecondChoiceRate] = useState<AdmissionsRateData | null>(null);
  const [seatUtilizationRate, setSeatUtilizationRate] = useState<AdmissionsRateData | null>(null);
  const [branchDemand, setBranchDemand] = useState<BranchDemandData[]>([]);
  const [overallAllocation, setOverallAllocation] = useState<OverallAllocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/kpis/admissions/total-applications?academic_year=${encodeURIComponent(academicYear)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch KPI: HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("Error fetching Total Applications KPI:", err);
      setError("Unable to connect to backend server or load database KPI.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpi();
  }, [academicYear]);

  const fetchOverallAllocation = async () => {
    try {
      const [applicationsResponse, branchSeatsResponse] = await Promise.all([
        fetch("/api/kpis/admissions/total-applications"),
        fetch("/api/kpis/admissions/seats-by-branch"),
      ]);
      if (!applicationsResponse.ok || !branchSeatsResponse.ok) {
        throw new Error("Failed to fetch allocation totals.");
      }
      const [applications, branchSeats] = await Promise.all([
        applicationsResponse.json(),
        branchSeatsResponse.json(),
      ]);
      const allocated = branchSeats.reduce(
        (sum: number, branch: { branch: string | null; seats_filled: number }) =>
          branch.branch?.trim() ? sum + Number(branch.seats_filled || 0) : sum,
        0,
      );
      const total = Number(applications.value || 0);
      setOverallAllocation({
        allocated,
        total,
        rate: total > 0 ? (allocated / total) * 100 : 0,
      });
    } catch (err) {
      console.error("Error fetching overall allocation rate:", err);
    }
  };

  useEffect(() => {
    fetchOverallAllocation();
  }, []);

  const fetchAdmissionsMetrics = async () => {
    const year = encodeURIComponent(academicYear);
    try {
      const [firstChoiceResponse, secondChoiceResponse, utilizationResponse, demandResponse] = await Promise.all([
        fetch(`/api/kpis/admissions/first-choice-allocation-rate?academic_year=${year}`),
        fetch(`/api/kpis/admissions/second-choice-allocation-rate?academic_year=${year}`),
        fetch(`/api/kpis/admissions/seat-utilization-rate?academic_year=${year}`),
        fetch(`/api/kpis/admissions/branch-demand-index?academic_year=${year}`),
      ]);
      if (![firstChoiceResponse, secondChoiceResponse, utilizationResponse, demandResponse].every((response) => response.ok)) {
        throw new Error("Failed to fetch Admissions metrics.");
      }
      const [firstChoice, secondChoice, utilization, demand] = await Promise.all([
        firstChoiceResponse.json(),
        secondChoiceResponse.json(),
        utilizationResponse.json(),
        demandResponse.json(),
      ]);
      setFirstChoiceRate(firstChoice);
      setSecondChoiceRate(secondChoice);
      setSeatUtilizationRate(utilization);
      setBranchDemand(demand);
    } catch (err) {
      console.error("Error fetching Admissions metrics:", err);
    }
  };

  useEffect(() => {
    fetchAdmissionsMetrics();
  }, [academicYear]);

  const formatPercentage = (value: number) => `${Number(value.toFixed(2))}%`;
  const gaugeRate = overallAllocation ? Math.min(Math.max(overallAllocation.rate, 0), 100) : 0;
  const remainingRate = 100 - gaugeRate;
  const remainingApplicants = overallAllocation
    ? Math.max(overallAllocation.total - overallAllocation.allocated, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] rounded-3xl p-6 md:p-7 border border-blue-900/20 shadow-lg shadow-blue-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute -right-8 -top-16 h-52 w-52 rounded-full bg-cyan-300/10 blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner"><Users className="text-cyan-200" size={24} /></span>
            Admissions Analytics & Intake Engine
          </h2>
          <p className="text-sm text-blue-100/90 mt-2">
            Real-time enrollment demand and student application metrics for ICFAI Tech School.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 backdrop-blur-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            PostgreSQL Live Sync
          </span>
          <button
            onClick={() => {
              fetchKpi();
              fetchAdmissionsMetrics();
              fetchOverallAllocation();
            }}
            className="p-2.5 text-white/80 hover:text-white rounded-xl border border-white/20 hover:bg-white/10 transition cursor-pointer"
            title="Refresh KPI Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-[#2952E3]" : ""} />
          </button>
        </div>

      </div>

      {/* Row 1: total applications and its historical chart. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* TOTAL APPLICATIONS KPI CARD */}
        <div className="relative overflow-hidden min-h-[230px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl border border-blue-400/30 shadow-lg shadow-blue-900/15 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 p-6 md:p-7 flex flex-col">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Users size={23} />
            </div>
            <span className="text-sm font-bold text-white">Total Applications</span>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 w-36 bg-slate-100 rounded-lg"></div>
                <div className="h-4 w-48 bg-slate-100 rounded-md"></div>
              </div>
            ) : error ? (
              <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-2">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={fetchKpi}
                  className="text-[11px] font-bold text-rose-700 underline cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {data?.value != null ? data.value.toLocaleString() : "0"}
                </div>
                <p className="text-sm font-medium text-blue-100">Applications received for ICFAI Tech School</p>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <span className="text-xs font-semibold text-white/80 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              Academic Year: <span className="text-white">{academicYear}</span>
            </span>
          </div>
        </div>

        <ApplicationsByYearChart />
      </div>

      {/* Row 2: seat utilization and the allocation comparison. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {[
          { label: "Seat Utilization Rate", metric: seatUtilizationRate, icon: Database },
        ].map(({ label, metric, icon: Icon }) => (
          <div key={label} className="relative overflow-hidden min-h-[230px] bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-3xl border border-emerald-400/30 shadow-lg shadow-teal-900/15 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 p-6 md:p-7 flex flex-col">
            <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Icon size={23} />
              </div>
              <span className="text-sm font-bold text-white">{label}</span>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {metric ? `${metric.value.toFixed(2)}%` : "—"}
              </div>
            </div>
          </div>
        ))}

      {/* Allocation Outcome comparison based on the two existing allocation KPIs. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-violet-50/50 to-amber-50/50 rounded-3xl border border-violet-100 shadow-lg shadow-violet-900/5 p-6 md:p-7">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-400" />
        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-slate-900">Allocation Outcome</h3>
          <p className="text-sm text-slate-500 mt-1">Relative comparison of first and second choice allocation rates</p>
        </div>
        {firstChoiceRate && secondChoiceRate && firstChoiceRate.value + secondChoiceRate.value > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "First Choice Allocation", value: firstChoiceRate.value, color: "#7C3AED" },
                      { name: "Second Choice Allocation", value: secondChoiceRate.value, color: "#F59E0B" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={3}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  >
                    <Cell fill="#7C3AED" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${Number(value ?? 0).toFixed(2)}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold uppercase tracking-wide text-violet-500">Allocation</span>
                <span className="text-sm font-extrabold text-slate-800">Comparison</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "First Choice Allocation", value: firstChoiceRate.value, color: "bg-violet-600" },
                { label: "Second Choice Allocation", value: secondChoiceRate.value, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl bg-white/90 border border-slate-100 shadow-sm px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">{item.value.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-400">
            {firstChoiceRate && secondChoiceRate ? "No allocation-rate values to compare." : "Loading allocation rates…"}
          </p>
        )}
      </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Overall allocation gauge reuses the existing all-years admissions endpoints. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/70 to-cyan-50/80 rounded-3xl border border-blue-100 shadow-lg shadow-blue-900/5 p-6 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-slate-900">Overall Allocation Rate</h3>
          <p className="text-sm text-slate-500 mt-1">Allocated students as a share of all applications</p>
        </div>
        {overallAllocation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="overallAllocationGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { name: "Allocated", value: gaugeRate },
                      { name: "Remaining", value: remainingRate },
                    ]}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    cx="50%"
                    cy="82%"
                    innerRadius="68%"
                    outerRadius="92%"
                    paddingAngle={1}
                    stroke="none"
                  >
                    <Cell fill="url(#overallAllocationGradient)" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${Number(value ?? 0).toFixed(2)}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-0 right-0 top-[66%] -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  {formatPercentage(overallAllocation.rate)}
                </span>
                <span className="text-sm font-semibold text-slate-500 mt-1">allocated</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between px-4 text-xs font-semibold text-slate-400">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" />
                    <span className="font-semibold text-slate-700">Allocated</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">{formatPercentage(gaugeRate)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 pl-6">
                  {overallAllocation.allocated.toLocaleString()} of {overallAllocation.total.toLocaleString()} applicants
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-300" />
                    <span className="font-semibold text-slate-700">Remaining</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">{formatPercentage(remainingRate)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 pl-6">
                  {remainingApplicants.toLocaleString()} applicants without an allocated branch
                </p>
              </div>
              <p className="text-xs text-slate-400">All academic years</p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-slate-400">
            Loading allocation data…
          </div>
        )}
      </div>

      {/* Branch demand detail remains separate from the main KPI cards. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-rose-50/40 to-orange-50/50 rounded-3xl border border-orange-100 shadow-lg shadow-orange-900/5 p-7 md:p-8">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 border border-white/50 flex items-center justify-center shadow-md shadow-orange-500/20">
                <Target size={22} className="text-white" />
              </span>
              Branch Demand Index
            </h3>
            <p className="text-sm text-slate-500 mt-2">First-choice applications as a share of all first choices</p>
          </div>
        </div>
        {branchDemand.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {branchDemand.map((branch, index) => {
              const barColors = ["bg-violet-600", "bg-cyan-600", "bg-amber-500", "bg-rose-500", "bg-emerald-600", "bg-blue-600"];
              return (
                <div key={branch.branch} className="rounded-2xl border border-white bg-white/85 shadow-sm hover:shadow-md transition-shadow p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-lg md:text-xl font-bold text-slate-800">{branch.branch}</h4>
                      <p className="text-sm text-slate-500 mt-1">{branch.first_choice_applications.toLocaleString()} first-choice applications</p>
                    </div>
                    <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                      {branch.demand_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 border border-slate-200/80 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full ${barColors[index % barColors.length]} transition-all duration-500`}
                      style={{ width: `${Math.min(branch.demand_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No first-choice applications available.</p>
        )}
      </div>

      </div>

    </div>
  );
}

