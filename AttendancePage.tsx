import { useCallback, useEffect, useState } from "react";
import { Activity, AlertCircle, AlertTriangle, CalendarCheck, Loader2, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AttendancePoint { department?: string; academic_year?: string; semester?: string; average_attendance: number; student_count: number; students_below_75?: number; }
interface AttendanceDashboardData {
  student_count: number; overall_attendance: number; students_below_75: number; students_below_65: number;
  status_distribution: { status: string; count: number }[];
  attendance_by_semester: AttendancePoint[]; attendance_by_department: AttendancePoint[]; attendance_by_year: AttendancePoint[];
  academic_years: string[]; departments: string[];
}
const statusColors: Record<string,string> = { Excellent: "#10B981", Good: "#3B82F6", Moderate: "#F59E0B", Warning: "#F59E0B", Critical: "#F43F5E" };
const selectClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none";
const pct = (value: number) => `${Number(value || 0).toFixed(2)}%`;

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceDashboardData | null>(null);
  const [academicYear, setAcademicYear] = useState("All");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({ academic_year: academicYear, department });
    try {
      const response = await fetch(`/api/kpis/attendance/dashboard?${params.toString()}`);
      if (!response.ok) throw new Error(`Attendance API returned HTTP ${response.status}`);
      setData(await response.json());
    } catch (err) {
      console.error("Error fetching Attendance dashboard:", err);
      setError("Unable to load attendance data from the dataset.");
    } finally { setLoading(false); }
  }, [academicYear, department]);
  useEffect(() => { void fetchAttendance(); }, [fetchAttendance]);

  const statusTotal = data?.status_distribution.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const kpis = data ? [
    { title: "Overall Attendance", value: pct(data.overall_attendance), description: `Average across ${data.student_count.toLocaleString()} valid records`, icon: CalendarCheck, color: "from-blue-600 to-indigo-700" },
    { title: "Students Below 75%", value: data.students_below_75.toLocaleString(), description: "Count of valid attendance records below threshold", icon: Users, color: "from-violet-600 to-fuchsia-700" },
    { title: "Students Below 65%", value: data.students_below_65.toLocaleString(), description: "Count of valid records needing urgent attention", icon: AlertTriangle, color: "from-orange-500 to-rose-600" },
  ] : [];

  const renderAttendanceByYearLineChart = (items: AttendancePoint[]) => (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Attendance by Academic Year
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Average attendance percentage trend across academic years
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          Line Graph
        </span>
      </div>
      <div className="h-72 mt-3">
        {items.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={items} margin={{ top: 20, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="academic_year"
                stroke="#64748B"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A1F44",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                  color: "#FFFFFF",
                  padding: "10px 14px",
                }}
                itemStyle={{ color: "#818CF8", fontWeight: "bold", fontSize: "13px" }}
                labelStyle={{ color: "#94A3B8", fontWeight: "600", fontSize: "11px", marginBottom: "4px" }}
                formatter={(value: any, _name: any, entry: any) => [
                  `${Number(value).toFixed(2)}% (${entry?.payload?.student_count ?? 0} students)`,
                  "Average Attendance",
                ]}
                labelFormatter={(label) => `Academic Year: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="average_attendance"
                name="Average Attendance"
                stroke="#4F46E5"
                strokeWidth={3.5}
                dot={{ r: 6, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 3 }}
                activeDot={{ r: 8, fill: "#06B6D4", stroke: "#FFFFFF", strokeWidth: 3 }}
                label={{
                  position: "top",
                  offset: 8,
                  formatter: (val: any) => `${Number(val || 0).toFixed(1)}%`,
                  fill: "#4F46E5",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">
            No valid attendance records for these filters.
          </p>
        )}
      </div>
    </article>
  );

  const departmentChart = (items: AttendancePoint[]) => (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
      <h2 className="text-lg font-extrabold text-slate-900">Attendance by Department</h2>
      <p className="mb-3 text-sm text-slate-500">Mean of recorded percentages; counts use valid attendance records only</p>
      <div className="h-72">
        {items.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="department" />
              <YAxis yAxisId="percent" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="count" orientation="right" allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [
                  name === "Average attendance" ? pct(Number(value)) : `${Number(value).toLocaleString()} students`,
                  name,
                ]}
              />
              <Bar yAxisId="percent" dataKey="average_attendance" name="Average attendance" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="count" dataKey="student_count" name="Valid students" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">No valid attendance records for these filters.</p>
        )}
      </div>
    </article>
  );

  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-r from-[#0A1F44] via-[#173B78] to-[#2952E3] p-6 text-white shadow-lg md:p-7"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-3"><span className="rounded-2xl border border-white/20 bg-white/15 p-3"><Activity size={22} /></span><div><h1 className="text-2xl font-extrabold">Attendance Analytics</h1><p className="mt-1 text-sm text-blue-100">Attendance compliance by academic year and department</p></div></div><p className="mt-3 text-xs text-blue-100/80">Academic year and department are mapped from Admissions by student ID. Missing percentages are excluded from averages and counts.</p></div><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="attendance-year">Academic year</label><select id="attendance-year" className={selectClass} value={academicYear} onChange={e => setAcademicYear(e.target.value)}><option value="All">All years</option>{(data?.academic_years ?? []).map(y => <option key={y}>{y}</option>)}</select><label className="sr-only" htmlFor="attendance-dept">Department</label><select id="attendance-dept" className={selectClass} value={department} onChange={e => setDepartment(e.target.value)}><option value="All">All departments</option>{(data?.departments ?? []).map(d => <option key={d}>{d}</option>)}</select><button type="button" onClick={() => void fetchAttendance()} aria-label="Refresh Attendance data" className="rounded-xl border border-white/20 p-2.5 hover:bg-white/10"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button></div></div></section>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertCircle className="mr-2 inline" size={17} />{error}</div>}
    {loading && !data ? <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-blue-700"><Loader2 className="animate-spin" /></div> : data && <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Filtered attendance KPIs">{kpis.map(({ title, value, description, icon: Icon, color }) => <article key={title} className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-md`}><div className="flex items-center justify-between"><h2 className="text-sm font-bold">{title}</h2><Icon size={20} /></div><p className="mt-3 text-3xl font-extrabold">{loading ? "?" : value}</p><p className="mt-1 text-xs text-white/80">{description}</p></article>)}</section>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">{renderAttendanceByYearLineChart(data.attendance_by_year)}{departmentChart(data.attendance_by_department)}</section>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2"><article className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-lg"><h2 className="text-lg font-extrabold text-slate-900">Average Attendance by Semester</h2><p className="mb-3 text-sm text-slate-500">Mean of valid attendance percentages</p><div className="h-72">{data.attendance_by_semester.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.attendance_by_semester}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="semester" tickFormatter={v=>`Sem ${v}`} /><YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} /><Tooltip formatter={v=>[pct(Number(v)),"Average attendance"]} /><Bar dataKey="average_attendance" fill="#0891B2" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-slate-400">No valid semester records.</p>}</div></article>
      <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-lg"><div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold text-slate-900">Recorded Attendance Status</h2><p className="text-sm text-slate-500">Counts and share among records with a status</p></div><span className="text-xs font-semibold text-slate-500">{statusTotal.toLocaleString()} records</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.status_distribution} dataKey="count" nameKey="status" innerRadius="52%" outerRadius="78%">{data.status_distribution.map(row=><Cell key={row.status} fill={statusColors[row.status] ?? "#8B5CF6"} />)}</Pie><Tooltip formatter={(v,name)=>[`${Number(v).toLocaleString()} records`,name]} /></PieChart></ResponsiveContainer></div><div className="flex flex-col justify-center gap-2">{data.status_distribution.map(row=><div key={row.status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{backgroundColor:statusColors[row.status]??"#8B5CF6"}} />{row.status}</span><b>{row.count.toLocaleString()} <span className="font-normal text-slate-500">({statusTotal ? (row.count/statusTotal*100).toFixed(1) : "0.0"}%)</span></b></div>)}</div></div></article></section>
    </>}
  </div>;
}
