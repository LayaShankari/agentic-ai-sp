from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Admission

def calculate_total_applications(db: Session, academic_year: Optional[str] = None) -> dict:
    """
    Calculates the Total Applications KPI for ICFAI Tech School (B.Tech).
    Formula: COUNT(DISTINCT student_id)
    """
    query = db.query(func.count(func.distinct(Admission.student_id))).filter(
        Admission.program == "B.Tech"
    )

    clean_year = academic_year.strip() if academic_year else None
    if clean_year and clean_year.lower() not in ["all", "all years", "all academic years", ""]:
        years = [y.strip() for y in clean_year.split("-") if y.strip()]
        if len(years) == 2:
            query = query.filter(Admission.admission_year.in_(years))
        else:
            query = query.filter(Admission.admission_year == clean_year)

    total_applications = query.scalar() or 0

    display_year = clean_year if (clean_year and clean_year.lower() not in ["all", "all years", "all academic years"]) else "All Academic Years"

    return {
        "kpi": "Total Applications",
        "value": total_applications,
        "academic_year": display_year,
        "institution": "ICFAI Tech School",
        "program": "B.Tech"
    }

def calculate_applications_by_year(db: Session) -> List[Dict[str, Any]]:
    """
    Calculates the total unique applications for each academic year (2023, 2024, 2025).
    Formula: COUNT(DISTINCT student_id) GROUP BY admission_year ORDER BY admission_year ASC
    """
    results = (
        db.query(
            Admission.admission_year.label("academic_year"),
            func.count(func.distinct(Admission.student_id)).label("total_applications")
        )
        .filter(Admission.program == "B.Tech")
        .group_by(Admission.admission_year)
        .order_by(Admission.admission_year.asc())
        .all()
    )

    return [
        {
            "academic_year": str(row.academic_year),
            "total_applications": int(row.total_applications)
        }
        for row in results
    ]


def calculate_total_seat_capacity(db: Session) -> dict:
    rows = db.query(
        Admission.allocated_branch,
        func.max(Admission.seat_capacity)
    ).filter(
        Admission.program == "B.Tech",
        Admission.allocated_branch.isnot(None)
    ).group_by(
        Admission.allocated_branch
    ).all()

    total_seat_capacity = sum(
        int(capacity) for _, capacity in rows if capacity is not None
    )

    return {
        "kpi": "Total Seat Capacity",
        "value": total_seat_capacity,
        "institution": "ICFAI Tech School",
        "program": "B.Tech"
    }


def _apply_admissions_year(query, academic_year: Optional[str]):
    clean_year = academic_year.strip() if academic_year else None
    if clean_year and clean_year.lower() not in ["all", "all years", "all academic years", ""]:
        years = [year.strip() for year in clean_year.split("-") if year.strip()]
        if len(years) == 2:
            return query.filter(Admission.admission_year.in_(years))
        return query.filter(Admission.admission_year == clean_year)
    return query


def _nonblank(column):
    return column.isnot(None) & (func.trim(column) != "")


def calculate_first_choice_allocation_rate(db: Session, academic_year: Optional[str] = None) -> dict:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    denominator = query.filter(_nonblank(Admission.first_choice_branch)).count()
    numerator = query.filter(
        _nonblank(Admission.first_choice_branch),
        _nonblank(Admission.allocated_branch),
        func.trim(Admission.allocated_branch) == func.trim(Admission.first_choice_branch),
    ).count()

    return {
        "kpi": "First Choice Allocation Rate",
        "value": numerator / denominator * 100 if denominator else 0.0,
        "academic_year": academic_year or "All Academic Years",
    }


def calculate_second_choice_allocation_rate(db: Session, academic_year: Optional[str] = None) -> dict:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    denominator = query.filter(_nonblank(Admission.second_choice_branch)).count()
    numerator = query.filter(
        _nonblank(Admission.second_choice_branch),
        _nonblank(Admission.allocated_branch),
        func.trim(Admission.allocated_branch) == func.trim(Admission.second_choice_branch),
    ).count()

    return {
        "kpi": "Second Choice Allocation Rate",
        "value": numerator / denominator * 100 if denominator else 0.0,
        "academic_year": academic_year or "All Academic Years",
    }


def calculate_seat_utilization_rate(db: Session, academic_year: Optional[str] = None) -> dict:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    seats_filled = query.filter(_nonblank(Admission.allocated_branch)).count()
    branch_capacities = (
        query.with_entities(
            func.trim(Admission.allocated_branch),
            func.max(Admission.seat_capacity),
        )
        .filter(_nonblank(Admission.allocated_branch))
        .group_by(func.trim(Admission.allocated_branch))
        .all()
    )
    total_capacity = sum(int(capacity) for _, capacity in branch_capacities if capacity is not None)

    return {
        "kpi": "Seat Utilization Rate",
        "value": seats_filled / total_capacity * 100 if total_capacity else 0.0,
        "academic_year": academic_year or "All Academic Years",
    }


def calculate_branch_demand_index(db: Session, academic_year: Optional[str] = None) -> List[Dict[str, Any]]:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    counts = (
        query.with_entities(
            func.trim(Admission.first_choice_branch).label("branch"),
            func.count(Admission.student_id).label("first_choice_applications"),
        )
        .filter(_nonblank(Admission.first_choice_branch))
        .group_by(func.trim(Admission.first_choice_branch))
        .order_by(func.trim(Admission.first_choice_branch).asc())
        .all()
    )
    total_applications = sum(int(row.first_choice_applications) for row in counts)

    return [
        {
            "branch": row.branch,
            "first_choice_applications": int(row.first_choice_applications),
            "demand_percentage": row.first_choice_applications / total_applications * 100 if total_applications else 0.0,
        }
        for row in counts
    ]
    
def calculate_seats_by_branch(db: Session) -> List[Dict[str, Any]]:
    results = db.query(
        Admission.allocated_branch,
        func.count(Admission.student_id).label("seats_filled")
    ).filter(
        Admission.program == "B.Tech",
        Admission.allocated_branch.isnot(None)
    ).group_by(
        Admission.allocated_branch
    ).all()

    return [
        {
            "branch": row.allocated_branch,
            "seats_filled": int(row.seats_filled)
        }
        for row in results
    ]
