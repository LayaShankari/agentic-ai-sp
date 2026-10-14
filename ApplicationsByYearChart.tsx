import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import { TrendingUp, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export interface ApplicationsByYearData {
  academic_year: string;
  total_applications: number;
}

export default function ApplicationsByYearChart({ academicYear = "All" }: { academicYear?: string }) {
  const [data, setData] = useState<ApplicationsByYearData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/kpis/admissions/applications-by-year");
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: HTTP ${response.status}`);
      }
      const jsonResult: ApplicationsByYearData[] = await response.json();
      setData(jsonResult);
    } catch (err: any) {
      console.error("Error fetching applications by year chart data:", err);
      setError("Unable to connect to backend server or fetch chart data from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  const visibleData = academicYear === "All"
    ? data
    : data.filter((row) => row.academic_year === academicYear);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/50 rounded-3xl p-6 md:p-7 border border-blue-100 shadow-lg shadow-blue-900/5 space-y-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-violet-500" />
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-blue-100/80 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20"><TrendingUp size={20} /></span>
            Total Applications by Year
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Application demand across years
          </p>
        </div>
        <button
          onClick={fetchChartData}
          className="p-2.5 text-blue-600 hover:text-blue-800 rounded-xl border border-blue-100 bg-white/80 hover:bg-blue-50 transition cursor-pointer shadow-sm"
          title="Refresh Chart Data"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-[#2952E3]" : ""} />
        </button>
      </div>

      {/* Chart Content Area */}
      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center space-y-3 bg-white/70 rounded-2xl border border-dashed border-blue-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching database records...</p>
        </div>
      ) : error ? (
        <div className="h-72 flex flex-col items-center justify-center p-6 text-center bg-rose-50/50 rounded-xl border border-rose-100 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button
            onClick={fetchChartData}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            Try Again
          </button>
        </div>
      ) : !visibleData || visibleData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
          <p className="text-xs font-semibold text-slate-600">No application data available</p>
          <p className="text-[11px] text-slate-400">Database contains no admissions records for 2023–2025.</p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visibleData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="4 5" stroke="#DBEAFE" vertical={false} />
              <XAxis
                dataKey="academic_year"
                stroke="#64748B"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#BFDBFE' }}
                dy={10}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                dx={-8}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A1F44',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                }}
                itemStyle={{ color: '#7DD3FC', fontWeight: 'bold', fontSize: '13px' }}
                labelStyle={{ color: '#94A3B8', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}
                formatter={(value: any) => [`${value} Applications`, 'Total Applications']}
                labelFormatter={(label) => `Academic Year: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="total_applications"
                name="Total Applications"
                stroke="#4F46E5"
                strokeWidth={4}
                dot={{ r: 6, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 3 }}
                activeDot={{ r: 8, fill: '#0891B2', stroke: '#FFFFFF', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
