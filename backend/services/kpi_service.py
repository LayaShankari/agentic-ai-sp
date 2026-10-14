from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Admission
from backend.capacity_config import ECE_CAPACITY_BY_YEAR

def calculate_total_applications(
    db: Session,
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
) -> dict:
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
    clean_department = department.strip() if department else None
    if clean_department and clean_department.lower() not in {"all", "all departments", ""}:
        query = query.filter(
            (func.trim(Admission.first_choice_branch) == clean_department)
            | (func.trim(Admission.second_choice_branch) == clean_department)
            | (func.trim(Admission.allocated_branch) == clean_department)
        )

    total_applications = query.scalar() or 0

    display_year = clean_year if (clean_year and clean_year.lower() not in ["all", "all years", "all academic years"]) else "All Academic Years"

    return {
        "kpi": "Total Applications",
        "value": total_applications,
        "academic_year": display_year,
        "institution": "ICFAI Tech School",
        "program": "B.Tech",
        "department": clean_department or "All Departments",
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


def calculate_total_seat_capacity(
    db: Session,
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
) -> dict:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    query = _apply_admissions_department(query, department)
    rows = query.with_entities(
        Admission.admission_year,
        func.trim(Admission.allocated_branch),
        func.min(Admission.seat_capacity),
        func.max(Admission.seat_capacity),
        func.count(func.distinct(Admission.seat_capacity)),
    ).filter(_nonblank(Admission.allocated_branch)).group_by(
        Admission.admission_year, func.trim(Admission.allocated_branch)
    ).all()
    capacity_by_department = {}
    unresolved = []
    capacity_by_department_year = []
    for year, department, minimum, maximum, distinct_count in rows:
        if str(department).upper() == "ECE" and str(year) in ECE_CAPACITY_BY_YEAR:
            capacity = ECE_CAPACITY_BY_YEAR[str(year)]
        elif minimum is None or distinct_count != 1 or int(minimum) <= 0:
            unresolved.append(f"{year} / {department}")
            continue
        else:
            capacity = int(minimum)
        capacity_by_department[department] = capacity_by_department.get(department, 0) + capacity
        capacity_by_department_year.append({"academic_year": str(year), "department": department, "capacity": capacity})
    total_seat_capacity = sum(capacity_by_department.values()) if not unresolved else None

    return {
        "kpi": "Total Seat Capacity",
        "value": total_seat_capacity,
        "available": total_seat_capacity is not None,
        "capacity_by_department": [
            {"department": department, "capacity": capacity}
            for department, capacity in sorted(capacity_by_department.items())
        ],
        "capacity_by_department_year": sorted(capacity_by_department_year, key=lambda item: (item["academic_year"], item["department"])),
        "unresolved_capacity_groups": unresolved,
        "academic_year": academic_year or "All Academic Years",
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


def _apply_admissions_department(query, department: Optional[str]):
    clean_department = department.strip() if department else None
    if clean_department and clean_department.lower() not in {"all", "all departments", ""}:
        query = query.filter(func.trim(Admission.allocated_branch) == clean_department)
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
    eligible = query.filter(_nonblank(Admission.second_choice_branch))
    denominator = eligible.with_entities(func.count(func.distinct(Admission.student_id))).scalar() or 0
    numerator = eligible.filter(
        _nonblank(Admission.second_choice_branch),
        _nonblank(Admission.allocated_branch),
        func.trim(Admission.allocated_branch) == func.trim(Admission.second_choice_branch),
    ).with_entities(func.count(func.distinct(Admission.student_id))).scalar() or 0

    return {
        "kpi": "Second Choice Allocation Rate",
        "value": numerator / denominator * 100 if denominator else None,
        "numerator": int(numerator),
        "denominator": int(denominator),
        "available": denominator > 0,
        "academic_year": academic_year or "All Academic Years",
    }


def calculate_seat_utilization_rate(
    db: Session,
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
) -> dict:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    query = _apply_admissions_department(query, department)
    seats_filled = query.filter(_nonblank(Admission.allocated_branch)).with_entities(
        func.count(func.distinct(Admission.student_id))
    ).scalar() or 0
    branch_capacities = (
        query.with_entities(
            Admission.admission_year,
            func.trim(Admission.allocated_branch),
            func.min(Admission.seat_capacity),
            func.max(Admission.seat_capacity),
            func.count(func.distinct(Admission.seat_capacity)),
        )
        .filter(_nonblank(Admission.allocated_branch))
        .group_by(Admission.admission_year, func.trim(Admission.allocated_branch))
        .all()
    )
    missing_capacity_details = []
    conflicting_capacity_groups = []
    resolved_capacities = []
    capacity_by_department = {}
    capacity_by_department_year = []
    for year, department, minimum, maximum, distinct_count in branch_capacities:
        key = (str(year), str(department).strip())
        if key[1].upper() == "ECE" and key[0] in ECE_CAPACITY_BY_YEAR:
            ece_capacity = ECE_CAPACITY_BY_YEAR[key[0]]
            resolved_capacities.append(ece_capacity)
            capacity_by_department[key[1]] = capacity_by_department.get(key[1], 0) + ece_capacity
            capacity_by_department_year.append({"academic_year": key[0], "department": key[1], "capacity": ece_capacity})
        elif minimum is None:
            missing_capacity_details.append({"academic_year": key[0], "department": key[1]})
        elif distinct_count > 1:
            capacity_values = query.with_entities(Admission.seat_capacity).filter(
                Admission.admission_year == year,
                func.trim(Admission.allocated_branch) == department,
                Admission.seat_capacity.isnot(None),
            ).distinct().order_by(Admission.seat_capacity).all()
            conflicting_capacity_groups.append({
                "academic_year": key[0], "department": key[1],
                "values": [int(value) for (value,) in capacity_values],
            })
        else:
            if int(minimum) <= 0:
                missing_capacity_details.append({"academic_year": key[0], "department": key[1]})
            else:
                resolved_capacities.append(int(minimum))
                capacity_by_department[key[1]] = capacity_by_department.get(key[1], 0) + int(minimum)
                capacity_by_department_year.append({"academic_year": key[0], "department": key[1], "capacity": int(minimum)})
    total_capacity = sum(resolved_capacities) if not missing_capacity_details and not conflicting_capacity_groups else None
    unresolved = missing_capacity_details + conflicting_capacity_groups
    unresolved_labels = [f"{item['academic_year']} / {item['department']}" for item in unresolved]
    missing_capacity_labels = [f"{item['academic_year']} / {item['department']}" for item in missing_capacity_details]
    available = seats_filled > 0 and total_capacity is not None and total_capacity > 0
    message = None
    if seats_filled == 0:
        message = "Allocated-student data is unavailable for this academic year."
    elif unresolved:
        message = "Seat-capacity data is missing, invalid, or conflicting for " + ", ".join(unresolved_labels) + "."
    elif total_capacity is None or total_capacity == 0:
        message = "Seat-capacity data is unavailable for allocated departments."

    return {
        "kpi": "Seat Utilization Rate",
        "value": seats_filled / total_capacity * 100 if available and total_capacity else None,
        "allocated_students": int(seats_filled),
        "total_capacity": int(total_capacity) if total_capacity is not None else None,
        "available": available,
        "over_capacity": available and seats_filled > total_capacity,
        "message": message,
        "capacity_warning": None,
        "capacity_conflicts": conflicting_capacity_groups,
        "missing_capacity_groups": missing_capacity_labels,
        "unresolved_capacity_groups": unresolved,
        "capacity_by_department": [
            {"department": department, "capacity": capacity}
            for department, capacity in sorted(capacity_by_department.items())
        ],
        "capacity_by_department_year": sorted(capacity_by_department_year, key=lambda item: (item["academic_year"], item["department"])),
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


def calculate_first_choice_allocations_by_department(db: Session, academic_year: Optional[str] = None, department: Optional[str] = None) -> List[Dict[str, Any]]:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    query = _apply_admissions_department(query, department)
    rows = query.with_entities(
        func.trim(Admission.allocated_branch).label("department"),
        func.count(func.distinct(Admission.student_id)).label("student_count"),
    ).filter(
        _nonblank(Admission.allocated_branch),
        _nonblank(Admission.first_choice_branch),
        func.trim(Admission.allocated_branch) == func.trim(Admission.first_choice_branch),
    ).group_by(func.trim(Admission.allocated_branch)).order_by(func.trim(Admission.allocated_branch)).all()
    return [{"department": row.department, "first_choice_allocations": int(row.student_count)} for row in rows]


def calculate_second_choice_allocations_by_department(db: Session, academic_year: Optional[str] = None, department: Optional[str] = None) -> List[Dict[str, Any]]:
    query = _apply_admissions_year(db.query(Admission).filter(Admission.program == "B.Tech"), academic_year)
    query = _apply_admissions_department(query, department)
    rows = query.with_entities(
        func.trim(Admission.allocated_branch).label("department"),
        func.count(func.distinct(Admission.student_id)).label("student_count"),
    ).filter(
        _nonblank(Admission.allocated_branch),
        _nonblank(Admission.second_choice_branch),
        func.trim(Admission.allocated_branch) == func.trim(Admission.second_choice_branch),
    ).group_by(func.trim(Admission.allocated_branch)).order_by(func.trim(Admission.allocated_branch)).all()
    return [{"department": row.department, "second_choice_allocations": int(row.student_count)} for row in rows]
