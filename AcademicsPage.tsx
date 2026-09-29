import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  Briefcase,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SemesterMarks {
  semester: string;
  average_marks: number;
}

interface SemesterCgpa {
  semester: string;
  average_cgpa: number;
}

interface AcademicsDashboardData {
  student_count: number;
  students_at_risk: number;
  scholarship_eligible_count: number;
  scholarship_eligible_percentage: number;
  nptel_participant_count: number;
  nptel_participation_percentage: number;
  internship_participant_count: number;
  internship_participation_percentage: number;
  placement_after_internship_count: number;
  placement_after_internship_percentage: number;
  marks_by_semester: SemesterMarks[];
  cgpa_by_semester: SemesterCgpa[];
}

const participationColors = ["#2563EB", "#8B5CF6", "#F97316"];

export default function AcademicsPage() {
  const [data, setData] = useState<AcademicsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/kpis/academics/dashboard");
      if (!response.ok) throw new Error(`Academics dashboard request failed (${response.status}).`);
      const result: AcademicsDashboardData = await response.json();
      setData(result);
    } catch (requestError) {
      console.error("Error fetching Academics dashboard:", requestError);
      setError("Unable to load Academics data. Check the backend connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const metrics = data
    ? [
        {
          title: "Students at Risk of Failure",
          value: data.students_at_risk.toLocaleString(),
          detail: `Below 40 marks · ${data.student_count} students analyzed`,
          icon: ShieldAlert,
          gradient: "from-rose-500 via-red-500 to-orange-500",
          shadow: "shadow-rose-900/15",
        },
        {
          title: "Scholarship-Eligible Students",
          value: `${data.scholarship_eligible_percentage.toFixed(2)}%`,
          detail: `${data.scholarship_eligible_count} students above 8 CGPA`,
          icon: Award,
          gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
          shadow: "shadow-violet-900/15",
        },
        {
          title: "NPTEL Course Participation",
          value: `${data.nptel_participation_percentage.toFixed(2)}%`,
          detail: `${data.nptel_participant_count} students participating`,
          icon: BookOpenCheck,
          gradient: "from-blue-600 via-indigo-600 to-violet-600",
          shadow: "shadow-blue-900/15",
        },
        {
          title: "Internship Participation",
          value: `${data.internship_participation_percentage.toFixed(2)}%`,
          detail: `${data.internship_participant_count} students participating`,
          icon: Briefcase,
          gradient: "from-teal-500 via-emerald-600 to-green-600",
          shadow: "shadow-emerald-900/15",
        },
        {
          title: "Placement After Internship",
          value: `${data.placement_after_internship_percentage.toFixed(2)}%`,
          detail: `${data.placement_after_internship_count} of ${data.internship_participant_count} interns placed`,
          icon: TrendingUp,
          gradient: "from-amber-500 via-orange-500 to-pink-500",
          shadow: "shadow-orange-900/15",
        },
      ]
    : [];

  const participationData = data
    ? [
        { name: "NPTEL Participation", value: data.nptel_participation_percentage },
        { name: "Internship Participation", value: data.internship_participation_percentage },
        { name: "Placement After Internship", value: data.placement_after_internship_percentage },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] p-6 shadow-lg shadow-blue-950/10 md:p-7">
        <div className="pointer-events-none absolute -right-8 -top-16 h-52 w-52 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-cyan-100 shadow-inner">
                <GraduationCap size={25} />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">Academics Analytics</h1>
                <p className="mt-1 text-sm text-blue-100/90">Student performance, participation, and outcomes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Academics Dataset · {data?.student_count ?? "—"} students
            </span>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              aria-label="Refresh Academics data"
              className="rounded-xl border border-white/20 p-2.5 text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 sm:flex-row sm:text-left">
          <AlertCircle size={22} />
          <p className="flex-1 text-sm font-semibold">{error}</p>
          <button type="button" onClick={() => void fetchDashboard()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700">
            Try again
          </button>
        </section>
      )}

      <section aria-label="Official Academics KPIs" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading && !data
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="min-h-48 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-11 w-11 rounded-2xl bg-slate-100" />
                <div className="mt-7 h-9 w-28 rounded-lg bg-slate-100" />
                <div className="mt-3 h-4 w-48 rounded bg-slate-100" />
              </div>
            ))
          : metrics.map(({ title, value, detail, icon: Icon, gradient, shadow }) => (
              <article key={title} className={`group relative min-h-48 overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg ${shadow} transition duration-200 hover:-translate-y-1 hover:shadow-xl`}>
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-xl transition group-hover:scale-110" />
                <div className="relative flex items-start justify-between gap-3">
                  <h2 className="max-w-[15rem] text-sm font-bold leading-snug text-white/95">{title}</h2>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner">
                    <Icon size={22} />
                  </span>
                </div>
                <p className="relative mt-5 text-4xl font-extrabold tracking-tight drop-shadow-sm md:text-[2.65rem]">{value}</p>
                <p className="relative mt-2 text-xs font-medium text-white/80">{detail}</p>
              </article>
            ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 p-6 shadow-lg shadow-blue-900/5 md:p-7">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-violet-500" />
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"><BookOpenCheck size={20} /></span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Average Marks by Semester</h2>
              <p className="mt-1 text-sm text-slate-500">Mean marks from the Academics records</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {loading && !data ? (
              <div className="flex h-full items-center justify-center text-blue-600"><Loader2 className="animate-spin" /></div>
            ) : data?.marks_by_semester.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.marks_by_semester} margin={{ top: 16, right: 16, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="academicsMarksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#DBEAFE" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="semester" tickLine={false} axisLine={{ stroke: "#BFDBFE" }} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `Sem ${value}`} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} marks`, "Average marks"]} labelFormatter={(label) => `Semester ${label}`} contentStyle={{ borderRadius: 14, border: "1px solid #DBEAFE", boxShadow: "0 12px 24px -12px rgba(30,64,175,.25)" }} />
                  <Bar dataKey="average_marks" name="Average marks" fill="url(#academicsMarksGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="flex h-full items-center justify-center text-sm text-slate-400">No marks data available.</p>}
          </div>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/50 to-fuchsia-50/40 p-6 shadow-lg shadow-violet-900/5 md:p-7">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-400 to-pink-400" />
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"><Award size={20} /></span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Average CGPA by Semester</h2>
              <p className="mt-1 text-sm text-slate-500">Mean CGPA across recorded students</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {loading && !data ? (
              <div className="flex h-full items-center justify-center text-violet-600"><Loader2 className="animate-spin" /></div>
            ) : data?.cgpa_by_semester.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cgpa_by_semester} margin={{ top: 16, right: 16, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="academicsCgpaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EDE9FE" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="semester" tickLine={false} axisLine={{ stroke: "#DDD6FE" }} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `Sem ${value}`} />
                  <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} CGPA`, "Average CGPA"]} labelFormatter={(label) => `Semester ${label}`} contentStyle={{ borderRadius: 14, border: "1px solid #E9D5FF", boxShadow: "0 12px 24px -12px rgba(126,34,206,.25)" }} />
                  <Bar dataKey="average_cgpa" name="Average CGPA" fill="url(#academicsCgpaGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="flex h-full items-center justify-center text-sm text-slate-400">No CGPA data available.</p>}
          </div>
        </article>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-rose-50/50 p-6 shadow-lg shadow-orange-900/5 md:p-7">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-orange-400" />
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20"><Briefcase size={20} /></span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Participation & Outcomes</h2>
            <p className="mt-1 text-sm text-slate-500">Real participation rates from Academics records</p>
          </div>
        </div>
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,1fr)]">
          <div className="h-64 w-full">
            {loading && !data ? (
              <div className="flex h-full items-center justify-center text-orange-600"><Loader2 className="animate-spin" /></div>
            ) : participationData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={participationData} margin={{ top: 4, right: 38, left: 12, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="name" width={176} tickLine={false} axisLine={false} tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Rate"]} contentStyle={{ borderRadius: 14, border: "1px solid #FED7AA", boxShadow: "0 12px 24px -12px rgba(194,65,12,.25)" }} />
                  <Bar dataKey="value" name="Participation rate" radius={[0, 9, 9, 0]} maxBarSize={34}>
                    {participationData.map((item, index) => <Cell key={item.name} fill={participationColors[index]} />)}
                    <LabelList dataKey="value" position="right" formatter={(value) => `${Number(value).toFixed(2)}%`} style={{ fill: "#334155", fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="flex h-full items-center justify-center text-sm text-slate-400">No participation data available.</p>}
          </div>
          <div className="space-y-3">
            {participationData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl border border-white bg-white/85 p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: participationColors[index] }} />
                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">{item.value.toFixed(2)}%</span>
              </div>
            ))}
            <p className="px-1 text-xs leading-relaxed text-slate-500">Placement rate is calculated among students who participated in internships.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
