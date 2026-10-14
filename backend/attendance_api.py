from fastapi import APIRouter, Query
from typing import Optional

from backend.services.attendance_service import calculate_attendance_dashboard


router = APIRouter(prefix="/api/kpis/attendance", tags=["Attendance"])


@router.get("/dashboard")
def get_attendance_dashboard(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    return calculate_attendance_dashboard(academic_year, department)
