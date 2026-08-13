import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Settings,
  FileText,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  User,
  ShieldCheck,
  Trash2,
  Database,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "./AuthContext";

type ModuleId =
  | "dashboard"
  | "admissions"
  | "academics"
  | "attendance"
  | "settings"
  | "reports"
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
    id: "reports",
    label: "Reports",
    icon: FileText,
    description: "Custom Data Reports & Export Analytics",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    description: "Documentation, System Support & Assistance",
  },
];

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [academicYear, setAcademicYear] = useState("2024 - 2025");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
                        : user?.role === "faculty"
                        ? "Faculty Member"
                        : "Viewer"}
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
              {/* Year Dropdown */}
              <div className="relative hidden md:block">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-brand-blue/30 cursor-pointer"
                >
                  <option value="2024 - 2025">2024 - 2025</option>
                  <option value="2023 - 2024">2023 - 2024</option>
                  <option value="2022 - 2023">2022 - 2023</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Search Bar */}
              <div className="relative hidden sm:block w-56 md:w-64">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white transition"
                />
              </div>

              {/* Notifications */}
              <button className="relative text-slate-500 hover:text-slate-800 p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-[#E31E24] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  5
                </span>
              </button>

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
                    {user?.role === "admin" ? "Super Admin" : user?.role || "Admin"}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Module Content View Renderer */}
          <main className="p-6 flex-1">
            {activeModule === "dashboard" && <PlainModuleView title="Dashboard" />}
            {activeModule === "admissions" && <PlainModuleView title="Admissions" />}
            {activeModule === "academics" && <PlainModuleView title="Academics" />}
            {activeModule === "attendance" && <PlainModuleView title="Attendance" />}
            {activeModule === "settings" && <SettingsModuleView />}
            {activeModule === "reports" && <PlainModuleView title="Reports" />}
            {activeModule === "help" && <PlainModuleView title="Help & Support" />}
          </main>

          {/* Footer Copyright */}
          <footer className="px-6 py-4 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 bg-white">
            © 2025 ICFAI Tech School. All rights reserved.
          </footer>
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

function SettingsModuleView() {
  const { loginLogs, clearLogs } = useAuth();

  return (
    <div className="space-y-6">
      {/* Login Activity Audit Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
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
