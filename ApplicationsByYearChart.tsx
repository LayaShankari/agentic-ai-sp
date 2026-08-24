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

export default function ApplicationsByYearChart() {
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

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-[#2952E3]" />
            Total Applications by Year
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Application demand across years
          </p>
        </div>
        <button
          onClick={fetchChartData}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          title="Refresh Chart Data"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-[#2952E3]" : ""} />
        </button>
      </div>

      {/* Chart Content Area */}
      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <Loader2 className="w-8 h-8 text-[#2952E3] animate-spin" />
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
      ) : !data || data.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
          <p className="text-xs font-semibold text-slate-600">No application data available</p>
          <p className="text-[11px] text-slate-400">Database contains no admissions records for 2023–2025.</p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="academic_year"
                stroke="#64748B"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
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
                itemStyle={{ color: '#60A5FA', fontWeight: 'bold', fontSize: '13px' }}
                labelStyle={{ color: '#94A3B8', fontWeight: '600', fontSize: '11px', marginBottom: '4px' }}
                formatter={(value: any) => [`${value} Applications`, 'Total Applications']}
                labelFormatter={(label) => `Academic Year: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="total_applications"
                name="Total Applications"
                stroke="#2952E3"
                strokeWidth={3}
                dot={{ r: 6, fill: '#2952E3', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
