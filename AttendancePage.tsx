import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AttendanceDashboardData {
  student_count: number;
  overall_attendance: number;
  students_below_75: number;
  students_below_65: number;
  status_distribution: { status: string; count: number }[];
  attendance_by_semester: {
    semester: string;
    average_attendance: number;
    student_count: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  Excellent: "#10B981",
  Good: "#3B82F6",
  Moderate: "#F59E0B",
  Critical: "#F43F5E",
};

const SEMESTER_COLORS = ["#2563EB", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E"];

const formatPercentage = (value: number) => `${Number(value.toFixed(2))}%`;

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/kpis/attendance/dashboard");
      if (!response.ok) throw new Error(`Attendance API returned HTTP ${response.status}`);
      setData(await response.json());
    } catch (err) {
      console.error("Error fetching Attendance dashboard:", err);
      setError("Unable to load attendance data from the dataset.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading && !data) {
    return (
      <div className="min-h-[420px] flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 via-white to-violet-50 border border-white shadow-sm">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-blue-600" size={20} />
          <span className="font-medium">Loading attendance analytics…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-10 text-center shadow-sm">
        <AlertCircle className="mx-auto text-rose-500" size={32} />
        <p className="mt-3 font-semibold text-rose-800">{error || "Attendance data is unavailable."}</p>
        <button onClick={fetchAttendance} className="mt-5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">
          Try Again
        </button>
      </div>
    );
  }

  const gaugeValue = Math.min(Math.max(data.overall_attendance, 0), 100);
  const remainingValue = 100 - gaugeValue;
  const statusTotal = data.status_distribution.reduce((sum, item) => sum + item.count, 0);

  const kpiCards = [
    {
      title: "Overall Attendance",
      value: formatPercentage(data.overall_attendance),
      description: `Average attendance across ${data.student_count.toLocaleString()} students`,
      icon: CalendarCheck,
      background: "from-blue-600 via-indigo-600 to-violet-700",
      glow: "shadow-blue-900/15",
    },
    {
      title: "Students Below 75%",
      value: data.students_below_75.toLocaleString(),
      suffix: "students",
      description: "Below the attendance requirement",
      icon: Users,
      background: "from-violet-600 via-purple-600 to-fuchsia-600",
      glow: "shadow-violet-900/15",
    },
    {
      title: "Students Below 65%",
      value: data.students_below_65.toLocaleString(),
      suffix: "students",
      description: "Students needing urgent attention",
      icon: AlertTriangle,
      background: "from-orange-500 via-rose-500 to-red-600",
      glow: "shadow-rose-900/15",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] p-6 md:p-8 text-white shadow-xl shadow-blue-950/10">
        <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute right-40 -bottom-28 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <Activity size={14} /> Institutional attendance analytics
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">Attendance Performance</h2>
            <p className="mt-2 max-w-xl text-sm text-blue-100/85">Monitor institutional attendance, compliance thresholds, and semester trends.</p>
          </div>
          <button onClick={fetchAttendance} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20" title="Refresh Attendance Data">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh data
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Attendance KPIs">
        {kpiCards.map(({ title, value, suffix, description, icon: Icon, background, glow }) => (
          <article key={title} className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br ${background} p-6 md:p-7 text-white shadow-xl ${glow}`}>
            <div className="absolute -right-8 -top-10 -z-10 h-36 w-36 rounded-full bg-white/10 blur-xl" />
            <div className="flex items-start justify-between gap-3">
              <h3 className="max-w-[220px] text-sm md:text-base font-bold leading-snug text-white/95">{title}</h3>
              <div className="rounded-2xl border border-white/20 bg-white/15 p-3 shadow-inner">
                <Icon size={22} />
              </div>
            </div>
            <div className="mt-7 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">{value}</span>
              {suffix && <span className="text-sm font-semibold text-white/85">{suffix}</span>}
            </div>
            <p className="mt-2 text-sm text-white/80">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Attendance charts">
        <article className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-lg shadow-slate-900/5">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-slate-900">Overall Attendance Gauge</h3>
            <p className="mt-1 text-sm text-slate-500">Institutional average on a 0–100% scale</p>
          </div>
          <div className="relative h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="attendanceGaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="55%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <Pie
                  data={[{ name: "Attendance", value: gaugeValue }, { name: "Remaining", value: remainingValue }]}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="84%"
                  innerRadius="68%"
                  outerRadius="94%"
                  paddingAngle={1}
                  stroke="none"
                >
                  <Cell fill="url(#attendanceGaugeGradient)" />
                  <Cell fill="#E8EDF5" />
                </Pie>
                <Tooltip formatter={(value, name) => [`${Number(value ?? 0).toFixed(2)}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 top-[62%] -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">{formatPercentage(data.overall_attendance)}</span>
              <span className="mt-1 text-sm font-semibold text-slate-500">overall attendance</span>
            </div>
            <div className="absolute bottom-1 left-3 right-3 flex justify-between px-3 text-xs font-semibold text-slate-400">
              <span>0%</span><span>100%</span>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-lg shadow-slate-900/5">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-slate-900">Attendance Status</h3>
            <p className="mt-1 text-sm text-slate-500">Student distribution by recorded status</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 items-center">
            <div className="relative h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.status_distribution} dataKey="count" nameKey="status" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="#FFFFFF" strokeWidth={3}>
                    {data.status_distribution.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#8B5CF6"} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${Number(value ?? 0).toLocaleString()} students`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900">{statusTotal.toLocaleString()}</span>
                <span className="text-xs font-semibold text-slate-500">students</span>
              </div>
            </div>
            <div className="space-y-3">
              {data.status_distribution.map((entry) => {
                const percentage = statusTotal ? (entry.count / statusTotal) * 100 : 0;
                return (
                  <div key={entry.status} className="rounded-xl bg-slate-50 px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#8B5CF6" }} />
                        <span className="text-sm font-semibold text-slate-700">{entry.status}</span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">{entry.count.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: STATUS_COLORS[entry.status] || "#8B5CF6" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-lg shadow-slate-900/5">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-md shadow-blue-900/15">
            <Activity size={21} />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Attendance by Semester</h3>
            <p className="mt-1 text-sm text-slate-500">Average attendance percentage across enrolled students</p>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.attendance_by_semester} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="#E9EEF5" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="semester" tickLine={false} axisLine={{ stroke: "#CBD5E1" }} tick={{ fill: "#64748B", fontSize: 13, fontWeight: 600 }} tickFormatter={(value) => `Semester ${value}`} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, "Average Attendance"]} labelFormatter={(label) => `Semester ${label}`} contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 14, boxShadow: "0 12px 30px rgba(15,23,42,.12)" }} />
              <Bar dataKey="average_attendance" name="Average Attendance" radius={[10, 10, 0, 0]} maxBarSize={76}>
                {data.attendance_by_semester.map((entry, index) => <Cell key={entry.semester} fill={SEMESTER_COLORS[index % SEMESTER_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
