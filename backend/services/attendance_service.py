from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd


ATTENDANCE_DATASET = Path(__file__).resolve().parents[2] / "SP DATASETS.xlsx"


def _clean_filter(value: Optional[str]) -> Optional[str]:
    value = value.strip() if value else ""
    return None if not value or value.casefold() == "all" else value


def calculate_attendance_dashboard(
    academic_year: Optional[str] = None, department: Optional[str] = None
) -> Dict[str, Any]:
    """Map attendance IDs to admission year/allocated branch and exclude missing percentages."""
    attendance = pd.read_excel(ATTENDANCE_DATASET, sheet_name="Attendence")
    admissions = pd.read_excel(ATTENDANCE_DATASET, sheet_name="Admission")
    attendance = attendance.dropna(subset=["Student_ID"]).copy()
    admissions = admissions.dropna(subset=["Student_ID"]).drop_duplicates("Student_ID")
    joined = attendance.merge(
        admissions[["Student_ID", "Admission_Year", "Allocated_Branch"]],
        on="Student_ID", how="left", validate="many_to_one",
    )
    joined["Admission_Year"] = joined["Admission_Year"].astype("string")
    joined["Allocated_Branch"] = joined["Allocated_Branch"].fillna("").astype(str).str.strip()
    joined["Attendance_Percentage"] = pd.to_numeric(joined["Attendance_Percentage"], errors="coerce")
    all_years = sorted(joined["Admission_Year"].dropna().unique().tolist())
    all_departments = sorted(v for v in joined["Allocated_Branch"].unique().tolist() if v)

    year_filter = _clean_filter(academic_year)
    department_filter = _clean_filter(department)
    filtered = joined.copy()
    if year_filter:
        filtered = filtered[filtered["Admission_Year"] == year_filter]
    if department_filter:
        filtered = filtered[filtered["Allocated_Branch"].str.casefold() == department_filter.casefold()]
    valid = filtered.dropna(subset=["Attendance_Percentage"]).copy()
    values = valid["Attendance_Percentage"]
    status = valid["Attendance_Status"].dropna().astype(str).str.strip()
    status = status[status != ""].value_counts()

    by_department = valid.groupby("Allocated_Branch").agg(
        average_attendance=("Attendance_Percentage", "mean"),
        student_count=("Student_ID", "nunique"),
        below_75=("Attendance_Percentage", lambda series: int((series < 75).sum())),
    ).sort_index()
    by_year = valid.groupby("Admission_Year").agg(
        average_attendance=("Attendance_Percentage", "mean"),
        student_count=("Student_ID", "nunique"),
        below_75=("Attendance_Percentage", lambda series: int((series < 75).sum())),
    ).sort_index()
    by_semester_frame = valid.copy()
    by_semester_frame["Semester"] = pd.to_numeric(by_semester_frame["Semester"], errors="coerce")
    by_semester = by_semester_frame.dropna(subset=["Semester"]).groupby("Semester")["Attendance_Percentage"].agg(["mean", "count"]).sort_index()

    def series_rows(frame, key_name: str):
        return [
            {key_name: str(k), "average_attendance": round(float(row["average_attendance"]), 2), "student_count": int(row["student_count"]), "students_below_75": int(row["below_75"])}
            for k, row in frame.iterrows()
        ]

    return {
        "student_count": int(valid["Student_ID"].nunique()),
        "overall_attendance": round(float(values.mean()), 2) if len(values) else 0.0,
        "students_below_75": int((values < 75).sum()),
        "students_below_65": int((values < 65).sum()),
        "status_distribution": [{"status": str(k), "count": int(v)} for k, v in status.items()],
        "attendance_by_semester": [
            {"semester": str(int(k)) if float(k).is_integer() else str(k), "average_attendance": round(float(row["mean"]), 2), "student_count": int(row["count"])}
            for k, row in by_semester.iterrows()
        ],
        "attendance_by_department": series_rows(by_department, "department"),
        "attendance_by_year": series_rows(by_year, "academic_year"),
        "academic_years": all_years,
        "departments": all_departments,
    }
