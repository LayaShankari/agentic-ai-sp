from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


ACADEMICS_DATASET = Path(__file__).resolve().parents[2] / "SP DATASETS.xlsx"


def _percentage(numerator: int, denominator: int) -> float:
    return round((numerator / denominator) * 100, 2) if denominator else 0.0


def calculate_academics_dashboard() -> Dict[str, Any]:
    """Return the official Academics KPIs and semester summaries from the source sheet."""
    dataframe = pd.read_excel(ACADEMICS_DATASET, sheet_name="Academics")
    dataframe = dataframe.dropna(how="all")

    student_ids = dataframe["Student_id"].fillna("").astype(str).str.strip()
    dataframe = dataframe.loc[student_ids.ne("")].copy()
    total_students = len(dataframe)

    marks = pd.to_numeric(dataframe["Average_Marks"], errors="coerce")
    cgpa = pd.to_numeric(dataframe["CGPA"], errors="coerce")
    nptel_yes = dataframe["NPTEL_Participation"].fillna("").astype(str).str.strip().str.casefold().eq("yes")
    internship_yes = dataframe["Internship_Participation"].fillna("").astype(str).str.strip().str.casefold().eq("yes")
    placement_yes = dataframe["Placement_After_Internship"].fillna("").astype(str).str.strip().str.casefold().eq("yes")

    at_risk_count = int((marks < 40).sum())
    scholarship_count = int((cgpa > 8).sum())
    nptel_count = int(nptel_yes.sum())
    internship_count = int(internship_yes.sum())
    placed_after_internship_count = int((internship_yes & placement_yes).sum())

    semester = pd.to_numeric(dataframe["Semester"], errors="coerce")
    marks_frame = pd.DataFrame({"semester": semester, "average_marks": marks}).dropna(subset=["semester", "average_marks"])
    cgpa_frame = pd.DataFrame({"semester": semester, "average_cgpa": cgpa}).dropna(subset=["semester", "average_cgpa"])
    marks_by_semester = marks_frame.groupby("semester")["average_marks"].mean().sort_index()
    cgpa_by_semester = cgpa_frame.groupby("semester")["average_cgpa"].mean().sort_index()

    def semester_rows(aggregates, metric_name: str) -> List[Dict[str, Any]]:
        return [
            {
                "semester": str(int(value)) if float(value).is_integer() else str(value),
                metric_name: round(float(average), 2),
            }
            for value, average in aggregates.items()
        ]

    return {
        "student_count": total_students,
        "students_at_risk": at_risk_count,
        "scholarship_eligible_count": scholarship_count,
        "scholarship_eligible_percentage": _percentage(scholarship_count, total_students),
        "nptel_participant_count": nptel_count,
        "nptel_participation_percentage": _percentage(nptel_count, total_students),
        "internship_participant_count": internship_count,
        "internship_participation_percentage": _percentage(internship_count, total_students),
        "placement_after_internship_count": placed_after_internship_count,
        "placement_after_internship_percentage": _percentage(placed_after_internship_count, internship_count),
        "marks_by_semester": semester_rows(marks_by_semester, "average_marks"),
        "cgpa_by_semester": semester_rows(cgpa_by_semester, "average_cgpa"),
    }
