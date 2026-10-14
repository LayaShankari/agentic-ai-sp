from fastapi import APIRouter, Query
from typing import Optional

from backend.services.academics_service import calculate_academics_dashboard


router = APIRouter(prefix="/api/kpis/academics", tags=["Academics"])


@router.get("/dashboard")
def get_academics_dashboard(
    academic_year: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    academic_category: Optional[str] = Query(None),
):
    return calculate_academics_dashboard(academic_year, department, academic_category)
