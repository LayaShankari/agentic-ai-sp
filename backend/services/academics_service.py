from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd


ACADEMICS_DATASET = Path(__file__).resolve().parents[2] / "SP DATASETS.xlsx"


def _clean_filter(value: Optional[str]) -> Optional[str]:
    value = value.strip() if value else ""
    return None if not value or value.casefold() == "all" else value


def calculate_academics_dashboard(
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
    academic_category: Optional[str] = None,
) -> Dict[str, Any]:
    """Aggregate academic records after mapping IDs to admission year and allocated branch."""
    academics = pd.read_excel(ACADEMICS_DATASET, sheet_name="Academics")
    admissions = pd.read_excel(ACADEMICS_DATASET, sheet_name="Admission")
    academics = academics.dropna(subset=["Student_id"]).copy()
    admissions = admissions.dropna(subset=["Student_ID"]).copy()
    admissions = admissions.drop_duplicates("Student_ID")
    joined = academics.merge(
        admissions[["Student_ID", "Admission_Year", "Allocated_Branch"]],
        left_on="Student_id", right_on="Student_ID", how="left", validate="many_to_one",
    )
    joined["Admission_Year"] = joined["Admission_Year"].astype("string")
    joined["Allocated_Branch"] = joined["Allocated_Branch"].fillna("").astype(str).str.strip()
    joined["Average_Marks"] = pd.to_numeric(joined["Average_Marks"], errors="coerce")
    joined["CGPA"] = pd.to_numeric(joined["CGPA"], errors="coerce")
    joined["Semester"] = pd.to_numeric(joined["Semester"], errors="coerce")
    all_years = sorted(joined["Admission_Year"].dropna().unique().tolist())
    all_departments = sorted(v for v in joined["Allocated_Branch"].unique().tolist() if v)
    all_categories = sorted(joined["Academic_Performance"].dropna().astype(str).str.strip().unique().tolist())

    year_filter = _clean_filter(academic_year)
    department_filter = _clean_filter(department)
    category_filter = _clean_filter(academic_category)
    filtered = joined.copy()
    if year_filter:
        filtered = filtered[filtered["Admission_Year"] == year_filter]
    if department_filter:
        filtered = filtered[filtered["Allocated_Branch"].str.casefold() == department_filter.casefold()]
    if category_filter:
        filtered = filtered[filtered["Academic_Performance"].astype(str).str.strip().str.casefold() == category_filter.casefold()]

    marks = filtered["Average_Marks"]
    cgpa = filtered["CGPA"]
    nptel_yes = filtered["NPTEL_Participation"].fillna("").astype(str).str.strip().str.casefold().eq("yes")
    internship_yes = filtered["Internship_Participation"].fillna("").astype(str).str.strip().str.casefold().eq("yes")
    placement_yes = filtered["Placement_After_Internship"].fillna("").astype(str).str.strip().str.casefold().eq("yes")

    def semester_averages(column: str, output: str, upper: Optional[float] = None):
        frame = filtered.dropna(subset=["Semester", column]).groupby("Semester")[column].mean().sort_index()
        return [{"semester": str(int(k)) if float(k).is_integer() else str(k), output: round(float(v), 2)} for k, v in frame.items()]

    department_failures = (
        filtered.dropna(subset=["Average_Marks"])
        .assign(failed=lambda frame: frame["Average_Marks"] < 40)
        .groupby("Allocated_Branch")["failed"].sum().sort_values(ascending=False)
    )
    nptel_students = filtered.assign(
        participating=nptel_yes,
        Admission_Year=filtered["Admission_Year"].fillna("Unknown"),
    ).groupby(["Admission_Year", "Allocated_Branch", "Student_id"], dropna=False).agg(
        participating=("participating", "max")
    ).reset_index()
    nptel_groups = nptel_students.groupby(["Admission_Year", "Allocated_Branch"], dropna=False).agg(
        student_count=("Student_id", "nunique"), participant_count=("participating", "sum")
    ).reset_index()
    nptel_groups = nptel_groups[nptel_groups["Allocated_Branch"].astype(str).str.strip() != ""]

    valid_marks = marks.dropna()
    valid_cgpa = cgpa.dropna()
    scholarship = int((valid_cgpa > 8).sum())
    placement_count = int((internship_yes & placement_yes).sum())
    nptel_unique = filtered.assign(participating=nptel_yes).groupby("Student_id", dropna=False)["participating"].max()
    nptel_participants = int(nptel_unique.sum())
    return {
        "student_count": int(filtered["Student_id"].nunique()),
        "students_at_risk": int((valid_marks < 40).sum()),
        "scholarship_eligible_count": scholarship,
        "scholarship_eligible_percentage": round(scholarship / len(valid_cgpa) * 100, 2) if len(valid_cgpa) else 0.0,
        "nptel_participant_count": nptel_participants,
        "nptel_participation_percentage": round(nptel_participants / len(nptel_unique) * 100, 2) if len(nptel_unique) else 0.0,
        "internship_participant_count": int(internship_yes.sum()),
        "internship_participation_percentage": round(int(internship_yes.sum()) / len(filtered) * 100, 2) if len(filtered) else 0.0,
        "placement_after_internship_count": placement_count,
        "placement_after_internship_percentage": round(placement_count / int(internship_yes.sum()) * 100, 2) if internship_yes.sum() else 0.0,
        "marks_by_semester": semester_averages("Average_Marks", "average_marks"),
        "cgpa_by_semester": semester_averages("CGPA", "average_cgpa"),
        "failure_by_department": [{"department": str(k) or "Unmapped", "failed_students": int(v)} for k, v in department_failures.items()],
        "nptel_by_department_year": [
            {"academic_year": str(row.Admission_Year), "department": str(row.Allocated_Branch), "student_count": int(row.student_count), "participant_count": int(row.participant_count)}
            for row in nptel_groups.itertuples(index=False)
        ],
        "academic_years": all_years,
        "departments": all_departments,
        "academic_categories": all_categories,
    }
