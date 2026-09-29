from pathlib import Path
from typing import Any, Dict

import pandas as pd


ATTENDANCE_DATASET = Path(__file__).resolve().parents[2] / "SP DATASETS.xlsx"


def calculate_attendance_dashboard() -> Dict[str, Any]:
    """Calculate Attendance dashboard values from the existing Attendence sheet."""
    dataframe = pd.read_excel(ATTENDANCE_DATASET, sheet_name="Attendence")
    dataframe["Attendance_Percentage"] = pd.to_numeric(
        dataframe["Attendance_Percentage"], errors="coerce"
    )
    valid_attendance = dataframe.dropna(subset=["Attendance_Percentage"])
    attendance_values = valid_attendance["Attendance_Percentage"]

    status_values = dataframe["Attendance_Status"].dropna().astype(str).str.strip()
    status_values = status_values[status_values != ""]
    status_counts = status_values.value_counts()

    semester_dataframe = valid_attendance.copy()
    semester_dataframe["Semester"] = pd.to_numeric(
        semester_dataframe["Semester"], errors="coerce"
    )
    semester_dataframe = semester_dataframe.dropna(subset=["Semester"])
    semester_aggregates = (
        semester_dataframe.groupby("Semester")["Attendance_Percentage"]
        .agg(["mean", "count"])
        .sort_index()
    )

    return {
        "student_count": int(len(valid_attendance)),
        "overall_attendance": float(attendance_values.mean()) if len(attendance_values) else 0.0,
        "students_below_75": int((attendance_values < 75).sum()),
        "students_below_65": int((attendance_values < 65).sum()),
        "status_distribution": [
            {"status": str(status), "count": int(count)}
            for status, count in status_counts.items()
        ],
        "attendance_by_semester": [
            {
                "semester": str(int(semester)) if float(semester).is_integer() else str(semester),
                "average_attendance": float(row["mean"]),
                "student_count": int(row["count"]),
            }
            for semester, row in semester_aggregates.iterrows()
        ],
    }
