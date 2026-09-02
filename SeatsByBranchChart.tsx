import { useEffect, useState } from "react";

export default function SeatsByBranchChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/kpis/admissions/seats-by-branch")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const maxSeats = Math.max(...data.map((item) => item.seats_filled), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
      <h2 className="text-xl font-bold text-slate-900">
        Seats Filled by Branch
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Distribution of filled seats across branches
      </p>

      <div className="mt-6 space-y-5">
        {data.map((item) => (
          <div key={item.branch}>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-slate-700">
                {item.branch}
              </span>

              <span className="font-bold text-slate-900">
                {item.seats_filled}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-4">
              <div
               className={`h-4 rounded-full ${
  item.branch === "AIDS"
    ? "bg-purple-500"
    : item.branch === "AIML"
    ? "bg-blue-500"
    : item.branch === "CSE"
    ? "bg-green-500"
    : item.branch === "ECE"
    ? "bg-orange-500"
    : "bg-pink-500"
}`}
                style={{
                  width: `${(item.seats_filled / maxSeats) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}