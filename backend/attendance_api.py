from fastapi import APIRouter

from backend.services.attendance_service import calculate_attendance_dashboard


router = APIRouter(prefix="/api/kpis/attendance", tags=["Attendance"])


@router.get("/dashboard")
def get_attendance_dashboard():
    return calculate_attendance_dashboard()
