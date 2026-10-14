import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Award, GraduationCap, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SemesterMarks { semester: string; average_marks: number; }
interface SemesterCgpa { semester: string; average_cgpa: number; }
interface AcademicsDashboardData {
  student_count: number;
  students_at_risk: number;
  scholarship_eligible_count: number;
  scholarship_eligible_percentage: number;
  nptel_participant_count: number;
  nptel_participation_percentage: number;
  marks_by_semester: SemesterMarks[];
  cgpa_by_semester: SemesterCgpa[];
  failure_by_department: { department: string; failed_students: number }[];
  nptel_by_department_year: { academic_year: string; department: string; student_count: number; participant_count: number }[];
  academic_years: string[];
  departments: string[];
  academic_categories: string[];
}

const selectClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none";

export default function AcademicsPage() {
  const [data, setData] = useState<AcademicsDashboardData | null>(null);
  const [academicYear, setAcademicYear] = useState("All");
  const [department, setDepartment] = useState("All");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ academic_year: academicYear, department, academic_category: category });
    try {
      const response = await fetch(`/api/kpis/academics/dashboard?${params.toString()}`);
      if (!response.ok) throw new Error(`Academics dashboard request failed (${response.status}).`);
      setData(await response.json());
    } catch (requestError) {
      console.error("Error fetching Academics dashboard:", requestError);
      setError("Unable to load Academics data. Check the backend connection and try again.");
    } finally { setLoading(false); }
  }, [academicYear, department, category]);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  const kpis = data ? [
    { label: "Students Analyzed", value: data.student_count.toLocaleString(), note: "Unique academic records", icon: GraduationCap, color: "from-blue-600 to-indigo-700" },
    { label: "Students at Risk", value: data.students_at_risk.toLocaleString(), note: "Marks below 40", icon: ShieldAlert, color: "from-rose-500 to-orange-600" },
    { label: "Scholarship Eligible", value: data.scholarship_eligible_count.toLocaleString(), note: `CGPA above 8 ? ${data.scholarship_eligible_percentage.toFixed(1)}%`, icon: Award, color: "from-violet-600 to-fuchsia-700" },
  ] : [];

  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] p-6 text-white shadow-lg md:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3"><span className="rounded-2xl border border-white/20 bg-white/15 p-3"><GraduationCap size={24} /></span><div><h1 className="text-2xl font-extrabold">Academics Analytics</h1><p className="mt-1 text-sm text-blue-100">Performance, failure risk, and NPTEL participation</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="academics-year">Academic year</label><select id="academics-year" className={selectClass} value={academicYear} onChange={e => setAcademicYear(e.target.value)}><option value="All">All years</option>{(data?.academic_years ?? []).map(y => <option key={y}>{y}</option>)}</select>
          <label className="sr-only" htmlFor="academics-department">Department</label><select id="academics-department" className={selectClass} value={department} onChange={e => setDepartment(e.target.value)}><option value="All">All departments</option>{(data?.departments ?? []).map(d => <option key={d}>{d}</option>)}</select>
          <label className="sr-only" htmlFor="academics-category">Academic category</label><select id="academics-category" className={selectClass} value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option>{(data?.academic_categories ?? []).map(c => <option key={c}>{c}</option>)}</select>
          <button type="button" onClick={() => void fetchDashboard()} aria-label="Refresh Academics data" className="rounded-xl border border-white/20 p-2.5 hover:bg-white/10"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>
      <p className="mt-3 text-xs text-blue-100/80">Year and department are mapped from Admissions by student ID. Academic category uses the dataset?s Academic_Performance field.</p>
    </section>

    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertCircle className="mr-2 inline" size={17} />{error}</div>}
    {loading && !data ? <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-blue-700"><Loader2 className="animate-spin" /></div> : data && <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Filtered academic KPIs">
        {kpis.map(({ label, value, note, icon: Icon, color }) => <article key={label} className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-md`}><div className="flex items-center justify-between"><h2 className="text-sm font-bold">{label}</h2><Icon size={20} /></div><p className="mt-3 text-3xl font-extrabold">{loading ? "?" : value}</p><p className="mt-1 text-xs text-white/80">{note}</p></article>)}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2" aria-label="Academic result charts">
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg"><h2 className="text-lg font-extrabold text-slate-900">Average Marks by Semester</h2><p className="mb-3 text-sm text-slate-500">Filtered student records</p><div className="h-72">{data.marks_by_semester.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.marks_by_semester}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="semester" tickFormatter={v => `Sem ${v}`} /><YAxis domain={[0,100]} /><Tooltip formatter={v => [`${Number(v).toFixed(2)} marks`, "Average"]} /><Bar dataKey="average_marks" fill="#4F46E5" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No marks for these filters.</p>}</div></article>
        <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-lg"><h2 className="text-lg font-extrabold text-slate-900">Average CGPA by Semester</h2><p className="mb-3 text-sm text-slate-500">Filtered student records</p><div className="h-72">{data.cgpa_by_semester.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.cgpa_by_semester}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="semester" tickFormatter={v => `Sem ${v}`} /><YAxis domain={[0,10]} /><Tooltip formatter={v => [`${Number(v).toFixed(2)} CGPA`, "Average"]} /><Bar dataKey="average_cgpa" fill="#A855F7" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No CGPA for these filters.</p>}</div></article>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-rose-100 bg-white p-5 shadow-lg"><h2 className="text-lg font-extrabold text-slate-900">Student Failures by Department</h2><p className="mb-3 text-sm text-slate-500">Students with Average_Marks below 40 marks, sorted from highest count</p><div className="h-72">{data.failure_by_department.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.failure_by_department}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="department" /><YAxis allowDecimals={false} /><Tooltip formatter={v => [`${Number(v).toLocaleString()} students`, "Failed"]} /><Bar dataKey="failed_students" name="Failed students" fill="#F43F5E" radius={[7,7,0,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No failures recorded for these filters.</p>}</div></article>
        <article className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-lg"><h2 className="text-lg font-extrabold text-slate-900">NPTEL Participation by Department and Year</h2><p className="mb-3 text-sm text-slate-500">Unique participating students from NPTEL_Participation records</p><div className="h-72">{data.nptel_by_department_year.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.nptel_by_department_year}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="department" /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(label, payload) => `Department: ${label} | Year: ${payload?.[0]?.payload?.academic_year ?? ""}`} formatter={(v, name) => [`${Number(v).toLocaleString()} students`, name]} /><Bar dataKey="student_count" name="Students analyzed" fill="#CBD5E1" radius={[5,5,0,0]} /><Bar dataKey="participant_count" name="NPTEL participants" fill="#0891B2" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No NPTEL participation records for these filters.</p>}</div></article>
      </section>
    </>}
  </div>;
}
